import structlog
from supabase import create_client, Client
from config import settings

logger = structlog.get_logger()

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
else:
    supabase = None
    logger.warning("Supabase URL or Service Key not configured.")
