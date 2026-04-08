FROM python:3.11-slim as builder

WORKDIR /app
COPY pyproject.toml .

# Install dependencies
RUN pip install --no-cache-dir build && \
    pip install --no-cache-dir .

FROM python:3.11-slim
WORKDIR /app

# Copy installed site-packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

# Run as non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
