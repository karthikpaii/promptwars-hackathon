# Use high-performance Python slim image
FROM python:3.11-slim

# Set working directory to /app
WORKDIR /app

# Copy the local directory contents into the container at /app
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the web service on container startup.
# Use gunicorn as the production-grade web server.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
