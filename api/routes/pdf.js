/**
 * PDF Processing Routes
 * Handles PDF operations like merge, split, compress, convert, etc.
 */

const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken, checkUsageLimit } = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
        files: parseInt(process.env.MAX_FILES_PER_JOB) || 10
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

/**
 * POST /api/pdf/merge
 * Merge multiple PDF files into one
 */
router.post('/merge', upload.array('files', 10), authenticateToken(false), checkUsageLimit, async (req, res) => {
    let jobId = null;
    
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 PDF files are required for merging'
            });
        }

        const { platform = 'snackpdf', options = {} } = req.body;
        const userId = req.user?.id || null;

        // Create job record
        const jobData = {
            user_id: userId,
            platform,
            tool_name: 'merge',
            job_type: 'sync',
            status: 'processing',
            input_files: req.files.map(file => ({
                name: file.originalname,
                size: file.size,
                type: file.mimetype
            })),
            processing_options: options,
            file_size_bytes: req.files.reduce((sum, file) => sum + file.size, 0),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };

        const { data: job, error: jobError } = await supabase
            .from('pdf_jobs')
            .insert(jobData)
            .select()
            .single();

        if (jobError) {
            logger.error('Job creation error:', jobError);
            return res.status(500).json({
                error: 'Failed to create processing job'
            });
        }

        jobId = job.id;

        // Process PDF merge
        const mergedPdf = await PDFDocument.create();
        
        for (const file of req.files) {
            try {
                const pdfDoc = await PDFDocument.load(file.buffer);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                
                pages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
                
                // Add bookmarks if requested
                if (options.addBookmarks) {
                    // Implementation for bookmarks would go here
                }
                
            } catch (error) {
                logger.error(`Error processing file ${file.originalname}:`, error);
                throw new Error(`Failed to process file: ${file.originalname}`);
            }
        }

        // Generate merged PDF buffer
        const mergedPdfBytes = await mergedPdf.save();
        
        // Upload to Supabase Storage
        const fileName = `merged-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET_PROCESSED)
            .upload(fileName, mergedPdfBytes, {
                contentType: 'application/pdf'
            });

        if (uploadError) {
            logger.error('Upload error:', uploadError);
            throw new Error('Failed to save merged PDF');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(process.env.SUPABASE_BUCKET_PROCESSED)
            .getPublicUrl(fileName);

        // Update job with results
        const outputFiles = [{
            name: fileName,
            size: mergedPdfBytes.length,
            type: 'application/pdf',
            url: urlData.publicUrl
        }];

        await supabase
            .from('pdf_jobs')
            .update({
                status: 'completed',
                output_files: outputFiles,
                completed_at: new Date().toISOString(),
                processing_time_ms: Date.now() - new Date(job.created_at).getTime()
            })
            .eq('id', jobId);

        // Update user usage count
        if (userId) {
            await supabase.rpc('increment_usage_count', { user_id: userId });
        }

        // Log activity
        await logActivity(userId, platform, 'pdf_merged', 'pdf_job', jobId, {
            file_count: req.files.length,
            output_size: mergedPdfBytes.length
        });

        res.json({
            message: 'PDFs merged successfully',
            job_id: jobId,
            result: {
                filename: fileName,
                size: formatFileSize(mergedPdfBytes.length),
                download_url: urlData.publicUrl,
                page_count: mergedPdf.getPageCount()
            }
        });

    } catch (error) {
        logger.error('PDF merge error:', error);
        
        // Update job status to failed
        if (jobId) {
            await supabase
                .from('pdf_jobs')
                .update({
                    status: 'failed',
                    error_message: error.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
        }

        res.status(500).json({
            error: 'Failed to merge PDFs',
            details: error.message
        });
    }
});

/**
 * POST /api/pdf/split
 * Split PDF into multiple files
 */
router.post('/split', upload.single('file'), authenticateToken(false), checkUsageLimit, async (req, res) => {
    let jobId = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'PDF file is required'
            });
        }

        const { platform = 'snackpdf', splitMode = 'all', pageRanges, intervalPages } = req.body;
        const userId = req.user?.id || null;

        // Create job record
        const jobData = {
            user_id: userId,
            platform,
            tool_name: 'split',
            job_type: 'sync',
            status: 'processing',
            input_files: [{
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }],
            processing_options: { splitMode, pageRanges, intervalPages },
            file_size_bytes: req.file.size,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };

        const { data: job, error: jobError } = await supabase
            .from('pdf_jobs')
            .insert(jobData)
            .select()
            .single();

        if (jobError) {
            logger.error('Job creation error:', jobError);
            return res.status(500).json({
                error: 'Failed to create processing job'
            });
        }

        jobId = job.id;

        // Load PDF
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        const totalPages = pdfDoc.getPageCount();
        const outputFiles = [];

        if (splitMode === 'all') {
            // Split every page into separate PDF
            for (let i = 0; i < totalPages; i++) {
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(page);
                
                const pdfBytes = await newPdf.save();
                const fileName = `page-${i + 1}-${Date.now()}.pdf`;
                
                // Upload to storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(process.env.SUPABASE_BUCKET_PROCESSED)
                    .upload(fileName, pdfBytes, {
                        contentType: 'application/pdf'
                    });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from(process.env.SUPABASE_BUCKET_PROCESSED)
                        .getPublicUrl(fileName);

                    outputFiles.push({
                        name: fileName,
                        size: pdfBytes.length,
                        type: 'application/pdf',
                        url: urlData.publicUrl,
                        pages: `${i + 1}`
                    });
                }
            }
        } else if (splitMode === 'range' && pageRanges) {
            // Split by specified page ranges
            const ranges = parsePageRanges(pageRanges, totalPages);
            
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
                const newPdf = await PDFDocument.create();
                const pages = await newPdf.copyPages(pdfDoc, range);
                
                pages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                const fileName = `pages-${range[0] + 1}-${range[range.length - 1] + 1}-${Date.now()}.pdf`;
                
                // Upload to storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(process.env.SUPABASE_BUCKET_PROCESSED)
                    .upload(fileName, pdfBytes, {
                        contentType: 'application/pdf'
                    });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from(process.env.SUPABASE_BUCKET_PROCESSED)
                        .getPublicUrl(fileName);

                    outputFiles.push({
                        name: fileName,
                        size: pdfBytes.length,
                        type: 'application/pdf',
                        url: urlData.publicUrl,
                        pages: `${range[0] + 1}-${range[range.length - 1] + 1}`
                    });
                }
            }
        } else if (splitMode === 'interval' && intervalPages) {
            // Split by interval
            const interval = parseInt(intervalPages);
            let startPage = 0;
            let fileIndex = 1;
            
            while (startPage < totalPages) {
                const endPage = Math.min(startPage + interval, totalPages);
                const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
                
                const newPdf = await PDFDocument.create();
                const pages = await newPdf.copyPages(pdfDoc, pageIndices);
                
                pages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                const fileName = `part-${fileIndex}-${Date.now()}.pdf`;
                
                // Upload to storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(process.env.SUPABASE_BUCKET_PROCESSED)
                    .upload(fileName, pdfBytes, {
                        contentType: 'application/pdf'
                    });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from(process.env.SUPABASE_BUCKET_PROCESSED)
                        .getPublicUrl(fileName);

                    outputFiles.push({
                        name: fileName,
                        size: pdfBytes.length,
                        type: 'application/pdf',
                        url: urlData.publicUrl,
                        pages: `${startPage + 1}-${endPage}`
                    });
                }
                
                startPage = endPage;
                fileIndex++;
            }
        }

        // Update job with results
        await supabase
            .from('pdf_jobs')
            .update({
                status: 'completed',
                output_files: outputFiles,
                completed_at: new Date().toISOString(),
                processing_time_ms: Date.now() - new Date(job.created_at).getTime()
            })
            .eq('id', jobId);

        // Update user usage count
        if (userId) {
            await supabase.rpc('increment_usage_count', { user_id: userId });
        }

        // Log activity
        await logActivity(userId, platform, 'pdf_split', 'pdf_job', jobId, {
            split_mode: splitMode,
            output_count: outputFiles.length,
            total_pages: totalPages
        });

        res.json({
            message: 'PDF split successfully',
            job_id: jobId,
            result: {
                files: outputFiles,
                total_files: outputFiles.length,
                original_pages: totalPages
            }
        });

    } catch (error) {
        logger.error('PDF split error:', error);
        
        // Update job status to failed
        if (jobId) {
            await supabase
                .from('pdf_jobs')
                .update({
                    status: 'failed',
                    error_message: error.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
        }

        res.status(500).json({
            error: 'Failed to split PDF',
            details: error.message
        });
    }
});

/**
 * GET /api/pdf/jobs/:jobId
 * Get job status and results
 */
router.get('/jobs/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.id;

        const { data: job, error } = await supabase
            .from('pdf_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', userId)
            .single();

        if (error || !job) {
            return res.status(404).json({
                error: 'Job not found'
            });
        }

        res.json({
            job: {
                id: job.id,
                tool_name: job.tool_name,
                status: job.status,
                input_files: job.input_files,
                output_files: job.output_files,
                error_message: job.error_message,
                processing_time_ms: job.processing_time_ms,
                created_at: job.created_at,
                completed_at: job.completed_at
            }
        });

    } catch (error) {
        logger.error('Get job error:', error);
        res.status(500).json({
            error: 'Failed to fetch job details'
        });
    }
});

/**
 * Helper Functions
 */

function parsePageRanges(rangeString, totalPages) {
    const ranges = [];
    const parts = rangeString.split(',').map(s => s.trim());
    
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
            if (start >= 0 && end < totalPages && start <= end) {
                ranges.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
            }
        } else {
            const page = parseInt(part) - 1;
            if (page >= 0 && page < totalPages) {
                ranges.push([page]);
            }
        }
    }
    
    return ranges.flat();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function logActivity(userId, platform, action, resourceType, resourceId, details) {
    try {
        await supabase
            .from('audit_log')
            .insert({
                user_id: userId,
                platform,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                details
            });
    } catch (error) {
        logger.error('Activity logging error:', error);
    }
}

/**
 * GET /api/pdf/status
 * Simple status check for PDF routes
 */
router.get('/status', (req, res) => {
    res.json({
        status: 'PDF routes active',
        available_endpoints: [
            'POST /api/pdf/merge',
            'POST /api/pdf/split',
            'GET /api/pdf/jobs/:jobId'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
