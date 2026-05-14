# Inter-service hostnames. Defaults to 127.0.0.1 for the all-in-one monolith
# case; can be overridden per-host via docker env_file when running a service
# elsewhere (e.g. clsi on Cloudflare Containers).
export CHAT_HOST=${CHAT_HOST:-127.0.0.1}
export CLSI_HOST=${CLSI_HOST:-127.0.0.1}
export CONTACTS_HOST=${CONTACTS_HOST:-127.0.0.1}
export DOCSTORE_HOST=${DOCSTORE_HOST:-127.0.0.1}
export DOCUMENT_UPDATER_HOST=${DOCUMENT_UPDATER_HOST:-127.0.0.1}
export DOCUPDATER_HOST=${DOCUPDATER_HOST:-127.0.0.1}
export FILESTORE_HOST=${FILESTORE_HOST:-127.0.0.1}
export HISTORY_V1_HOST=${HISTORY_V1_HOST:-127.0.0.1}
export NOTIFICATIONS_HOST=${NOTIFICATIONS_HOST:-127.0.0.1}
export PROJECT_HISTORY_HOST=${PROJECT_HISTORY_HOST:-127.0.0.1}
export REALTIME_HOST=${REALTIME_HOST:-127.0.0.1}
export WEB_HOST=${WEB_HOST:-127.0.0.1}
export WEB_API_HOST=${WEB_API_HOST:-127.0.0.1}
