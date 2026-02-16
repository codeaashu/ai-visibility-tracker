if [ -f "$AC_VERTEX_CREDENTIALS_PATH" ]; then
    echo "OK: Vertex credentials found"
else
    echo "ERROR: Vertex credentials not found"
    exit 1
fi
if [ -n "$AC_OPENAI_API_KEY" ]; then
    echo "OK: OpenAI API key found"
else
    echo "ERROR: OpenAI API key not found"
    exit 1
fi
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
