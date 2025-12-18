#!/bin/bash

# 1. Register Admin
echo "Registering Admin..."
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username": "adminUser", "email": "admin@example.com", "password": "password123", "adminSecret": "secret123"}'

echo -e "\n\n"

# 2. Login Admin
echo "Logging in Admin..."
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "admin@example.com", "password": "password123"}'

echo -e "\n\n"

# 3. Register Normal User (Control)
echo "Registering Normal User..."
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username": "normalUser", "email": "normal@example.com", "password": "password123"}'
