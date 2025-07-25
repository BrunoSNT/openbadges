#!/bin/bash

# OP Full Stack Development Script
# Run this from the root directory to start the complete development environment

set -e

# Initialize process IDs
VALIDATOR_PID=""
API_PID=""
FRONTEND_PID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Enhanced output functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

echo "🎯 OP Full Stack Development Environment"
echo "========================================"

# Check if we're in the root directory (should have api, app, and programs folders)
if [ ! -d "api" ] || [ ! -d "app" ] || [ ! -d "programs" ]; then
    echo "❌ Error: Please run this script from the root directory of the OP project"
    echo "Expected structure:"
    echo "  ./api/     - JWT + Onchain API"
    echo "  ./app/     - React Frontend"
    echo "  ./programs/ - Solana Programs"
    exit 1
fi

echo "✅ Project structure verified"

# Check prerequisites
echo ""
print_status "Checking prerequisites..."

# Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi
print_success "Node.js: $(node --version)"

# Yarn
if ! command_exists yarn; then
    print_error "Yarn is not installed. Install with: npm install -g yarn"
    exit 1
fi
print_success "Yarn: $(yarn --version)"

# Solana CLI
if command_exists solana; then
    print_success "Solana CLI: $(solana --version | head -n1)"
    echo "   Network: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
else
    print_warning "Solana CLI not found (optional for frontend development)"
fi

# Anchor
if command_exists anchor; then
    print_success "Anchor: $(anchor --version)"
else
    print_warning "Anchor not found (required for program development)"
fi

echo ""
print_status "Installing dependencies..."

# Install API dependencies
if [ ! -d "api/node_modules" ]; then
    print_status "Installing API dependencies..."
    cd api && yarn install && cd ..
else
    print_success "API dependencies already installed"
fi

# Install Frontend dependencies
if [ ! -d "app/node_modules" ]; then
    print_status "Installing Frontend dependencies..."
    cd app && yarn install && cd ..
else
    print_success "Frontend dependencies already installed"
fi

# Install root dependencies if package.json exists
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    yarn install
fi

echo ""
echo "🚀 What would you like to do?"
echo "1) Start Full Stack (Validator + API + Frontend)"
echo "2) Start API only"
echo "3) Start Frontend only"
echo "4) Build and test everything"
echo "5) Run Anchor tests"
echo "6) Run Integration tests"
echo "7) Exit"
echo ""

# Check if an argument was passed
if [ $# -gt 0 ]; then
    choice=$1
    echo "Using option: $choice"
else
    echo "💡 Tip: You can also run directly with: anchor run fullstack, anchor run api-only, etc."
    echo ""
    read -p "Choose an option (1-7): " choice
    
    # Handle empty input
    while [[ -z "$choice" ]]; do
        echo "⚠️  Please enter a number between 1-7"
        read -p "Choose an option (1-7): " choice
    done
fi

# Validate choice
if [[ ! "$choice" =~ ^[1-7]$ ]]; then
    echo "❌ Invalid option '$choice'. Please choose 1-7."
    echo ""
    echo "💡 Available shortcuts:"
    echo "   anchor run fullstack       - Start everything"
    echo "   anchor run api-only        - Start API only"
    echo "   anchor run frontend-only   - Start frontend only"
    echo "   anchor run build-all       - Build everything"
    echo "   anchor run test-anchor     - Run tests"
    echo "   anchor run test-integration - Run integration tests"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    print_status "Stopping all services..."
    if [ ! -z "$VALIDATOR_PID" ]; then
        kill $VALIDATOR_PID 2>/dev/null || true
        print_success "Stopped validator"
    fi
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        print_success "Stopped API server"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Stopped frontend"
    fi
    print_success "All services stopped!"
    exit 0
}

# Integration test functions
print_test() {
    echo -e "\033[1;33m[TEST]\033[0m $1"
}

print_pass() {
    echo -e "\033[0;32m[PASS]\033[0m $1"
}

print_fail() {
    echo -e "\033[0;31m[FAIL]\033[0m $1"
}

# Function to run integration tests
run_integration_tests() {
    echo "🧪 Running Integration Tests..."
    echo "=============================="
    
    local test_failed=0
    
    # Test API health
    print_test "Testing API health endpoint..."
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_pass "API health check"
    else
        print_fail "API health check - is the API server running?"
        test_failed=1
    fi
    
    # Test Solana RPC
    print_test "Testing Solana RPC connection..."
    if curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' http://localhost:8899 > /dev/null 2>&1; then
        print_pass "Solana RPC connection"
    else
        print_fail "Solana RPC connection - is the validator running?"
        test_failed=1
    fi
    
    # Test frontend
    print_test "Testing frontend accessibility..."
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_pass "Frontend accessibility"
    else
        print_fail "Frontend accessibility - is the frontend running?"
        test_failed=1
    fi
    
    # Test API CORS
    print_test "Testing API CORS configuration..."
    if curl -s -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://localhost:3001/api/auth/login > /dev/null 2>&1; then
        print_pass "API CORS configuration"
    else
        print_fail "API CORS configuration"
        test_failed=1
    fi
    
    # Test API endpoints (without authentication)
    print_test "Testing API endpoints structure..."
    local health_response=$(curl -s http://localhost:3001/health 2>/dev/null)
    if echo "$health_response" | grep -q "status"; then
        print_pass "API health endpoint format"
    else
        print_fail "API health endpoint format"
        test_failed=1
    fi
    
    echo ""
    echo "Integration test summary:"
    echo "- API Server: $([ $test_failed -eq 0 ] && echo "✓ Running and accessible" || echo "❌ Issues detected")"
    echo "- Solana RPC: $([ $test_failed -eq 0 ] && echo "✓ Running and accessible" || echo "❌ Issues detected")"
    echo "- Frontend: $([ $test_failed -eq 0 ] && echo "✓ Running and accessible" || echo "❌ Issues detected")"
    echo "- CORS: $([ $test_failed -eq 0 ] && echo "✓ Properly configured" || echo "❌ Issues detected")"
    echo ""
    
    if [ $test_failed -eq 0 ]; then
        echo "🎉 All integration tests passed!"
        echo ""
        echo "Next steps:"
        echo "1. Open http://localhost:5173 in your browser"
        echo "2. Connect your Solana wallet"
        echo "3. Go to /dashboard and test the integration"
        echo "4. Use the Badge Management features"
    else
        echo "❌ Some integration tests failed!"
        echo "Please check that all services are running properly."
        return 1
    fi
    
    return 0
}

case $choice in
    1)
        print_status "Starting Full Stack..."
        
        # Check if solana-test-validator is available
        if ! command_exists solana-test-validator; then
            print_error "solana-test-validator not found"
            print_error "Please install Solana CLI tools"
            exit 1
        fi
        
        # Set up cleanup trap
        trap cleanup EXIT INT TERM
        
        # Check if services are already running
        if port_in_use 8899; then
            print_warning "Port 8899 is in use (Solana validator might be running)"
        fi
        
        if port_in_use 3001; then
            print_warning "Port 3001 is in use (API server might be running)"
        fi
        
        if port_in_use 5173; then
            print_warning "Port 5173 is in use (Frontend might be running)"
        fi
        
        # Start Solana local validator
        print_status "Starting Solana local validator..."
        if port_in_use 8899; then
            print_warning "Solana validator appears to be already running on port 8899"
        else
            print_status "Starting new Solana validator..."
            solana-test-validator &
            VALIDATOR_PID=$!
            
            # Wait for validator to be ready
            if wait_for_service "http://localhost:8899" "Solana validator"; then
                print_success "Solana validator started successfully (PID: $VALIDATOR_PID)"
            else
                print_error "Failed to start Solana validator"
                exit 1
            fi
        fi
        
        # Deploy the program if needed
        print_status "Checking program deployment..."
        if command_exists anchor; then
            print_status "Building Anchor program..."
            if anchor build > /dev/null 2>&1; then
                print_status "Deploying program..."
                anchor deploy
                print_success "Program deployed successfully"
            else
                print_warning "Could not build/deploy program. Make sure you're in the correct directory."
            fi
        else
            print_warning "Anchor not found, skipping program deployment"
        fi
        
        # Install API dependencies and start server
        print_status "Setting up API server..."
        cd api
        
        if [ ! -d "node_modules" ]; then
            print_status "Installing API dependencies..."
            yarn install
        fi
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
            print_warning ".env file not found in api directory. Creating from .env.example..."
            if [ -f ".env.example" ]; then
                cp .env.example .env
                print_status "Please review and update the .env file with correct values"
            fi
        fi
        
        print_status "Starting API server..."
        yarn dev > ../api.log 2>&1 &
        API_PID=$!
        
        # Wait for API to be ready
        if wait_for_service "http://localhost:3001/health" "API server"; then
            print_success "API server started successfully (PID: $API_PID)"
        else
            print_error "Failed to start API server. Check api.log for details."
            exit 1
        fi
        
        cd ..
        
        # Install frontend dependencies and start
        print_status "Setting up frontend..."
        cd app
        
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            yarn install
        fi
        
        # Check if .env.local exists
        if [ ! -f ".env.local" ]; then
            print_warning ".env.local file not found in app directory."
            print_status "The frontend will use default environment variables."
        fi
        
        print_status "Starting frontend development server..."
        yarn dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        
        cd ..
        
        # Wait for frontend to be ready
        if wait_for_service "http://localhost:5173" "Frontend"; then
            print_success "Frontend started successfully (PID: $FRONTEND_PID)"
        else
            print_error "Failed to start frontend. Check frontend.log for details."
            exit 1
        fi
        
        # Print summary
        echo ""
        print_success "🚀 All services are running!"
        echo ""
        echo "� Service Status:"
        echo "  • Solana Validator: http://localhost:8899"
        echo "  • API Server: http://localhost:3001"
        echo "  • Frontend: http://localhost:5173"
        echo ""
        echo "📝 Logs:"
        echo "  • API: api.log"
        echo "  • Frontend: frontend.log"
        echo "  • Solana: Run 'solana logs' in another terminal"
        echo ""
        echo "� Integration Testing:"
        echo "  1. Open http://localhost:5173 in your browser"
        echo "  2. Connect your Solana wallet"
        echo "  3. Go to /dashboard and use the Integration tab"
        echo "  4. Run the connection tests and badge management"
        echo ""
        echo "⏹️  To stop all services:"
        echo "  • Kill this script with Ctrl+C"
        echo "  • Or run: kill $VALIDATOR_PID $API_PID $FRONTEND_PID"
        echo ""
        
        # Keep script running and handle cleanup
        print_status "Press Ctrl+C to stop all services..."
        
        # Wait for user interrupt
        while true; do
            sleep 1
        done
        ;;
    2)
        print_status "Starting API only..."
        trap cleanup EXIT INT TERM
        
        # Check if port is in use
        if port_in_use 3001; then
            print_warning "Port 3001 is in use (API server might be running)"
        fi
        
        cd api
        
        # Check dependencies
        if [ ! -d "node_modules" ]; then
            print_status "Installing API dependencies..."
            yarn install
        fi
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
            print_warning ".env file not found in api directory. Creating from .env.example..."
            if [ -f ".env.example" ]; then
                cp .env.example .env
                print_status "Please review and update the .env file with correct values"
            fi
        fi
        
        print_status "Starting API server..."
        yarn dev > ../api.log 2>&1 &
        API_PID=$!
        cd ..
        
        # Wait for API to be ready
        if wait_for_service "http://localhost:3001/health" "API server"; then
            print_success "API server started successfully (PID: $API_PID)"
            echo ""
            echo "📊 Service Status:"
            echo "  • API Server: http://localhost:3001"
            echo "  • API Health: http://localhost:3001/health"
            echo ""
            echo "📝 Logs:"
            echo "  • API: api.log"
            echo ""
            print_status "Press Ctrl+C to stop the API server..."
        else
            print_error "Failed to start API server. Check api.log for details."
            exit 1
        fi
        
        # Wait for user interrupt
        while true; do
            sleep 1
        done
        ;;
    3)
        print_status "Starting Frontend only..."
        trap cleanup EXIT INT TERM
        
        # Check if port is in use
        if port_in_use 5173; then
            print_warning "Port 5173 is in use (Frontend might be running)"
        fi
        
        cd app
        
        # Check dependencies
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            yarn install
        fi
        
        # Check if .env.local exists
        if [ ! -f ".env.local" ]; then
            print_warning ".env.local file not found in app directory."
            print_status "The frontend will use default environment variables."
        fi
        
        print_status "Starting frontend development server..."
        yarn dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        # Wait for frontend to be ready
        if wait_for_service "http://localhost:5173" "Frontend"; then
            print_success "Frontend started successfully (PID: $FRONTEND_PID)"
            echo ""
            echo "📊 Service Status:"
            echo "  • Frontend: http://localhost:5173"
            echo ""
            echo "📝 Logs:"
            echo "  • Frontend: frontend.log"
            echo ""
            print_status "Press Ctrl+C to stop the frontend..."
        else
            print_error "Failed to start frontend. Check frontend.log for details."
            exit 1
        fi
        
        # Wait for user interrupt
        while true; do
            sleep 1
        done
        ;;
    4)
        print_status "Building and testing everything..."
        
        print_status "Building API..."
        cd api
        if [ -f "package.json" ]; then
            yarn build
            if [ $? -ne 0 ]; then
                print_error "API build failed"
                cd ..
                exit 1
            fi
            print_success "API build completed"
        else
            print_warning "No package.json found in API directory"
        fi
        cd ..
        
        print_status "Building Frontend..."
        cd app
        if [ -f "package.json" ]; then
            yarn build
            if [ $? -ne 0 ]; then
                print_error "Frontend build failed"
                cd ..
                exit 1
            fi
            print_success "Frontend build completed"
        else
            print_warning "No package.json found in app directory"
        fi
        cd ..
        
        if [ -f "package.json" ]; then
            print_status "Running root tests..."
            yarn test
            if [ $? -ne 0 ]; then
                print_error "Tests failed"
                exit 1
            fi
            print_success "Root tests completed"
        fi
        
        print_success "Build and test complete!"
        ;;
    5)
        print_status "Running Anchor tests..."
        if command_exists anchor; then
            # Check if test validator is running, if not start it
            if ! pgrep -f "solana-test-validator" > /dev/null; then
                print_status "Starting test validator for tests..."
                solana-test-validator --reset &
                VALIDATOR_PID=$!
                trap cleanup EXIT INT TERM
                sleep 5
            fi
            
            anchor test
            test_result=$?
            
            if [ $test_result -eq 0 ]; then
                print_success "All tests passed!"
            else
                print_error "Some tests failed"
                exit 1
            fi
        else
            print_error "Anchor not found. Please install Anchor CLI."
            echo "Visit: https://www.anchor-lang.com/docs/installation"
            exit 1
        fi
        ;;
    6)
        print_status "Running Integration tests..."
        
        # Check if curl is available
        if ! command_exists curl; then
            print_error "curl is required for integration tests. Please install curl and try again."
            exit 1
        fi
        
        # Run the integration tests
        run_integration_tests
        
        if [ $? -eq 0 ]; then
            echo ""
            print_success "Integration tests completed successfully!"
        else
            echo ""
            print_error "Integration tests failed!"
            print_error "Make sure all services are running by selecting option 1 first."
            exit 1
        fi
        ;;
    7)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-7."
        exit 1
        ;;
esac
