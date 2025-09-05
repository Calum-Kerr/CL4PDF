-- =====================================================
-- CL4PDF Database Schema for SnackPDF & RevisePDF
-- =====================================================
-- This schema supports both SnackPDF (iLovePDF clone) and RevisePDF (PDFfiller clone)
-- Created: 2025-01-05
-- Database: PostgreSQL (Supabase)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'business', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 10, -- Free tier limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- User sessions for tracking
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(100), -- 'snackpdf' or 'revisepdf'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- SUBSCRIPTIONS & BILLING
-- =====================================================

-- Stripe subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PDF PROCESSING & JOBS
-- =====================================================

-- PDF processing jobs
CREATE TABLE public.pdf_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('snackpdf', 'revisepdf')),
    tool_name VARCHAR(100) NOT NULL, -- 'merge', 'split', 'compress', 'convert', 'edit', etc.
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('sync', 'async')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
    input_files JSONB NOT NULL, -- Array of file info: [{name, size, type, url}]
    output_files JSONB, -- Array of output file info
    processing_options JSONB, -- Tool-specific options
    error_message TEXT,
    processing_time_ms INTEGER,
    file_size_bytes BIGINT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Job status tracking for async operations
CREATE TABLE public.job_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.pdf_jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT MANAGEMENT (RevisePDF)
-- =====================================================

-- User documents for RevisePDF
CREATE TABLE public.user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    page_count INTEGER,
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    folder_path VARCHAR(500) DEFAULT '/',
    tags TEXT[], -- Array of tags
    metadata JSONB, -- Document metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- PDF form templates (RevisePDF)
CREATE TABLE public.pdf_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'tax', 'legal', 'business', 'medical', etc.
    subcategory VARCHAR(100),
    template_url TEXT NOT NULL,
    thumbnail_url TEXT,
    page_count INTEGER NOT NULL,
    form_fields JSONB, -- Field definitions
    is_popular BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & AUDIT LOG
-- =====================================================

-- Comprehensive audit log for analytics
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('snackpdf', 'revisepdf')),
    action VARCHAR(100) NOT NULL, -- 'login', 'tool_use', 'file_upload', 'file_download', etc.
    resource_type VARCHAR(50), -- 'pdf_job', 'document', 'template', etc.
    resource_id UUID,
    details JSONB, -- Action-specific details
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_platform ON public.user_sessions(platform);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- PDF jobs indexes
CREATE INDEX idx_pdf_jobs_user_id ON public.pdf_jobs(user_id);
CREATE INDEX idx_pdf_jobs_platform ON public.pdf_jobs(platform);
CREATE INDEX idx_pdf_jobs_tool_name ON public.pdf_jobs(tool_name);
CREATE INDEX idx_pdf_jobs_status ON public.pdf_jobs(status);
CREATE INDEX idx_pdf_jobs_created_at ON public.pdf_jobs(created_at);
CREATE INDEX idx_pdf_jobs_user_platform ON public.pdf_jobs(user_id, platform);

-- Job status indexes
CREATE INDEX idx_job_status_job_id ON public.job_status(job_id);
CREATE INDEX idx_job_status_created_at ON public.job_status(created_at);

-- User documents indexes
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_is_template ON public.user_documents(is_template);
CREATE INDEX idx_user_documents_is_public ON public.user_documents(is_public);
CREATE INDEX idx_user_documents_folder_path ON public.user_documents(folder_path);
CREATE INDEX idx_user_documents_created_at ON public.user_documents(created_at);

-- PDF templates indexes
CREATE INDEX idx_pdf_templates_category ON public.pdf_templates(category);
CREATE INDEX idx_pdf_templates_is_popular ON public.pdf_templates(is_popular);
CREATE INDEX idx_pdf_templates_download_count ON public.pdf_templates(download_count);
CREATE INDEX idx_pdf_templates_tags ON public.pdf_templates USING GIN(tags);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_platform ON public.audit_log(platform);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_audit_log_user_platform ON public.audit_log(user_id, platform);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- PDF jobs policies
CREATE POLICY "Users can view own jobs" ON public.pdf_jobs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own jobs" ON public.pdf_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own jobs" ON public.pdf_jobs
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Job status policies
CREATE POLICY "Users can view job status for own jobs" ON public.job_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pdf_jobs
            WHERE pdf_jobs.id = job_status.job_id
            AND (pdf_jobs.user_id = auth.uid() OR pdf_jobs.user_id IS NULL)
        )
    );

-- User documents policies
CREATE POLICY "Users can view own documents" ON public.user_documents
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own documents" ON public.user_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.user_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.user_documents
    FOR DELETE USING (auth.uid() = user_id);

-- PDF templates policies (public read access)
CREATE POLICY "Anyone can view templates" ON public.pdf_templates
    FOR SELECT USING (true);

-- Audit log policies
CREATE POLICY "Users can view own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_templates_updated_at BEFORE UPDATE ON public.pdf_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_platform TEXT,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        platform,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        p_platform,
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert popular PDF templates for RevisePDF
INSERT INTO public.pdf_templates (name, description, category, subcategory, template_url, thumbnail_url, page_count, is_popular, tags) VALUES
('W-9 Form', 'Request for Taxpayer Identification Number and Certification', 'tax', 'irs', '/templates/w9.pdf', '/templates/thumbs/w9.jpg', 1, true, ARRAY['tax', 'irs', 'w9', 'taxpayer']),
('W-2 Form', 'Wage and Tax Statement', 'tax', 'irs', '/templates/w2.pdf', '/templates/thumbs/w2.jpg', 1, true, ARRAY['tax', 'irs', 'w2', 'wages']),
('1099-MISC Form', 'Miscellaneous Income', 'tax', 'irs', '/templates/1099-misc.pdf', '/templates/thumbs/1099-misc.jpg', 1, true, ARRAY['tax', 'irs', '1099', 'income']),
('Employment Application', 'Standard Job Application Form', 'business', 'hr', '/templates/job-application.pdf', '/templates/thumbs/job-application.jpg', 2, true, ARRAY['employment', 'hr', 'application']),
('Rental Agreement', 'Residential Lease Agreement', 'legal', 'real-estate', '/templates/rental-agreement.pdf', '/templates/thumbs/rental-agreement.jpg', 3, true, ARRAY['rental', 'lease', 'real-estate']),
('Medical Consent Form', 'Patient Medical Consent and Release', 'medical', 'consent', '/templates/medical-consent.pdf', '/templates/thumbs/medical-consent.jpg', 2, false, ARRAY['medical', 'consent', 'patient']),
('Invoice Template', 'Professional Invoice Template', 'business', 'finance', '/templates/invoice.pdf', '/templates/thumbs/invoice.jpg', 1, true, ARRAY['invoice', 'billing', 'business']),
('Contract Template', 'General Service Contract', 'legal', 'contracts', '/templates/service-contract.pdf', '/templates/thumbs/service-contract.jpg', 4, false, ARRAY['contract', 'legal', 'service']);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This schema provides:
-- 1. Complete user management with Supabase Auth integration
-- 2. Stripe subscription handling
-- 3. PDF job processing for both platforms
-- 4. Document management for RevisePDF
-- 5. Template library for forms
-- 6. Comprehensive audit logging
-- 7. Proper RLS security
-- 8. Performance indexes
-- 9. Automated triggers for data integrity
-- =====================================================
