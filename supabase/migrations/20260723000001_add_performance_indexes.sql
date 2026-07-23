-- Add performance indexes for Planning & Forecast queries

-- Index on status field for harvest_forecasts (frequently filtered by status)
CREATE INDEX IF NOT EXISTS idx_harvest_forecasts_status ON harvest_forecasts(status);

-- Composite index on status and date for harvest_forecasts (optimizes the common query pattern)
CREATE INDEX IF NOT EXISTS idx_harvest_forecasts_status_date ON harvest_forecasts(status, projected_harvest_date);

-- Composite index on date and status for lgu_distributions
CREATE INDEX IF NOT EXISTS idx_lgu_distributions_date_status ON lgu_distributions(distribution_date, status);

-- Composite index on date and status for projected_waste_reports
CREATE INDEX IF NOT EXISTS idx_projected_waste_date_status ON projected_waste_reports(projected_date, status);
