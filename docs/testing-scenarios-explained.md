# Performance Testing Scenarios: Purpose and Explanation

This document explains the different performance testing scenarios in the k6 testing framework and their specific purposes.

## 1. Baseline Test (Smoke Test)

**Purpose**: To verify that the system works under minimal load conditions and establish a performance baseline.

**Key Characteristics**:
- Uses a small number of virtual users (3 VUs)
- Short duration (1 minute)
- Tests basic functionality of the application
- Verifies system is operational before proceeding with more intensive tests

**When to Use**:
- After deployment to verify the system is functioning correctly
- As a preliminary test before running more intensive tests
- For daily health checks of the application

**Success Criteria**:
- All endpoints respond with appropriate status codes
- Response times meet the defined thresholds:
  - 50% of requests complete under 200ms
  - 90% of requests complete under 400ms
  - 95% of requests complete under 600ms
- Error rate remains below 10%

## 2. Load Test

**Purpose**: To assess the system's behavior under expected normal load conditions.

**Key Characteristics**:
- Gradually increases to 10 virtual users over 1 minute
- Maintains 10 users for 3 minutes
- Gradually decreases to 0 users over 1 minute
- Total duration: 5 minutes

**When to Use**:
- To verify performance under normal expected traffic
- To identify performance bottlenecks under expected load
- To validate capacity planning and resource allocation

**Success Criteria**:
- System maintains acceptable response times under normal load
- No degradation in error rates
- Resources (CPU, memory, etc.) remain within acceptable limits

## 3. Soak Test

**Purpose**: To evaluate the system's stability and performance during extended periods of consistent load.

**Key Characteristics**:
- Gradually increases to 50 virtual users over 5 minutes
- Maintains 50 users for a long period (2 hours)
- Gradually decreases to 0 users over 5 minutes
- Total duration: ~2 hours and 10 minutes

**When to Use**:
- To identify performance issues that appear over time (memory leaks, resource depletion)
- To verify system stability for extended periods
- To validate that performance doesn't degrade over time

**Success Criteria**:
- Performance remains consistent throughout the test duration
- No increase in error rates over time
- No unexpected resource growth (memory, connections, etc.)
- System recovers properly after extended use

## 4. Spike Test

**Purpose**: To evaluate how the system handles sudden, dramatic increases in load.

**Key Characteristics**:
- Starts with 10 users for 2 minutes
- Rapidly increases to 300 users over 1 minute (a 30x increase)
- Maintains 300 users for 3 minutes
- Rapidly decreases to 10 users over 1 minute
- Completes ramp down to 0 users
- Total duration: 8 minutes

**When to Use**:
- To test system behavior during traffic spikes (sales events, marketing campaigns)
- To verify auto-scaling capabilities work correctly
- To identify failure points under extreme load changes

**Success Criteria**:
- System continues to function during traffic spikes
- Error rates remain acceptable even during spike periods
- System recovers quickly once the spike subsides
- Resource scaling mechanisms activate appropriately

## 5. Stress Test

**Purpose**: To find the breaking point of the system by gradually increasing load beyond expected capacity.

**Key Characteristics**:
- Gradually ramps up from 10 to 300 users in several increments:
  - 10 users for 2 minutes
  - Increases to 50 users over 5 minutes
  - Increases to 100 users over 5 minutes
  - Increases to 200 users over 5 minutes
  - Increases to 300 users over 5 minutes
  - Decreases to 0 users over 2 minutes
- Total duration: 24 minutes

**When to Use**:
- To determine maximum system capacity
- To identify the breaking point of the system
- To understand degradation patterns under extreme load
- To validate scaling and failover mechanisms

**Success Criteria**:
- System handles load up to the expected maximum capacity
- System degrades gracefully rather than crashing completely
- Clear identification of performance bottlenecks
- Error rates and response times provide clear indicators of system limits

## 6. Simple Test

**Purpose**: To verify API endpoints are accessible and responding correctly with minimal configuration.

**Key Characteristics**:
- Uses a small number of virtual users (3 VUs)
- Very short duration (30 seconds)
- Tests only the most critical endpoints
- Minimal setup required

**When to Use**:
- For quick verification of API functionality
- As a preliminary test to ensure the test environment is properly configured
- When troubleshooting API connectivity issues

**Success Criteria**:
- All tested endpoints respond with 200 status codes
- Response times meet basic thresholds
- No errors encountered during the test

## Key Performance Metrics

Across all test types, we're monitoring the following key metrics:

1. **Response Time**:
   - p50 (median): 50% of requests should complete faster than this threshold
   - p90: 90% of requests should complete faster than this threshold
   - p95: 95% of requests should complete faster than this threshold

2. **Error Rate**:
   - Percentage of requests that failed
   - Target is typically less than 10% for all test types

3. **Throughput**:
   - Number of requests per second the system can handle

4. **Concurrent Users**:
   - Number of simultaneous virtual users (VUs) the system can support

## Viewing Results

All test results are sent to InfluxDB and can be visualized in Grafana at:
http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x

## 7. E-Commerce Flow Test

**Purpose**: To simulate real user journeys through an e-commerce application, testing the full purchase flow from browsing to checkout.

**Key Characteristics**:
- Tests the entire user journey including:
  - Browsing the homepage
  - Viewing product categories
  - Searching for products
  - Viewing product details
  - Adding items to cart
  - Completing checkout
- Available in all testing patterns (baseline, load, stress, spike, soak)
- Measures specialized metrics including:
  - Page load time
  - Checkout completion time
  - API latency
  - User actions count

**Available Scenarios**:
1. **Baseline E-Commerce**: 3 VUs for 1 minute to verify basic functionality
2. **Load E-Commerce**: Ramp up to 10 users over 5 minutes to test normal operations
3. **Stress E-Commerce**: Gradually increase to 300 users to find breaking points
4. **Spike E-Commerce**: Sudden surge to 300 users to test handling of traffic spikes
5. **Soak E-Commerce**: Sustained load of 50 users for 30+ minutes to test stability

**When to Use**:
- To test the complete user journey rather than individual endpoints
- When validating end-to-end performance of complex, multi-step processes
- To identify performance bottlenecks in specific user workflows
- When simulating realistic user behavior patterns

**Success Criteria**:
- Complete user journeys successfully execute
- Page load times stay under 2 seconds (95th percentile)
- Checkout process completes in under 3 seconds (95th percentile)
- API latency remains under 500ms (95th percentile)
- HTTP request durations stay under 1 second (95th percentile)

**Benefits Over Individual Endpoint Tests**:
- Tests the application as users actually experience it
- Validates integration points between different services
- Identifies performance issues in multi-step workflows
- Provides more realistic performance metrics for business processes
