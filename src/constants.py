from enum import Enum

MATERIAL_TYPE_SIMPLE_NEEDS_CACHE_KEY = 'material_type_simple_needs_{id}'
MATERIAL_TYPE_SIMPLE_NEEDS_TTL = 60 * 60 * 24

# API clients
DEFAULT_REQUEST_TIMEOUT_SECONDS = 60


# Failsafe
FAILSAFE_ALLOWED_RETRIES: int = 3
FAILSAFE_BACKOFF_SECONDS: float = 0.2

# LLM
COMPLETION_TEMPERATURE = 0.2
COMPLETION_MAX_TOKENS = 5000

#FILE TEMPLATES
class FileTemplatesNamingEnum(str, Enum):
    NON_QUALIFY_PROF_LIST = 'non_qualify_prof_list'
    IOT_BLANK = 'iot_blank'
    REQUIRING_TRAINING_SIZ_LIST = 'requiring_training_siz_list'
    TRAINEE_WORKERS_LIST = 'trainee_workers_list'
    INTRODUCTORY_BRIEFING_PROGRAM = 'introductory_briefing_program'
