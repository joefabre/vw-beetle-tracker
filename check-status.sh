#!/bin/bash

# VW Beetle Tracker - Database Status Checker

echo "🚗 VW Beetle Tracker - Database Status Check"
echo "===========================================\n"

# Check if server is running
echo "1. Checking local server status..."
if lsof -ti:8080 > /dev/null; then
    echo "   ✅ Local server is running on port 8080"
    echo "   🌐 App URL: http://localhost:8080"
else
    echo "   ❌ Local server is NOT running"
    echo "   🔧 Starting server..."
    cd /Users/joefabre/desktop/vw-beetle-tracker
    python3 -m http.server 8080 > server.log 2>&1 &
    sleep 2
    if lsof -ti:8080 > /dev/null; then
        echo "   ✅ Server started successfully"
    else
        echo "   ❌ Failed to start server"
    fi
fi

echo

# Check internet connectivity
echo "2. Checking internet connectivity..."
if ping -c 1 google.com > /dev/null 2>&1; then
    echo "   ✅ Internet connection is working"
else
    echo "   ❌ No internet connection detected"
fi

echo

# Check Firebase connectivity
echo "3. Checking Firebase connectivity..."
if curl -s --max-time 5 https://firestore.googleapis.com > /dev/null; then
    echo "   ✅ Can reach Firebase servers"
else
    echo "   ❌ Cannot reach Firebase servers"
    echo "   💡 Check firewall/proxy settings"
fi

echo
echo "📊 Status Summary:"
echo "   - Local server: http://localhost:8080"
echo "   - Status page: http://localhost:8080/status.html"
echo "   - Diagnostic: http://localhost:8080/firebase-diagnostic.html"
echo
echo "🚀 Next steps:"
echo "   1. Open http://localhost:8080/status.html in your browser"
echo "   2. The page will automatically test your database"
echo "   3. Green = working, Red = problem with specific fix suggestions"
echo

