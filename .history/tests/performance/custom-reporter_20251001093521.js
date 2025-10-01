/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * Performance Test Reporter
 */

class PerformanceReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
        this.results = new Map();
    }

    onRunStart() {
        console.log('\nN-HDR Performance Test Suite');
        console.log('============================\n');
    }

    onTestStart(test) {
        this.results.set(test.path, {
            name: test.path,
            startTime: process.hrtime.bigint(),
            measurements: []
        });
    }

    onTestResult(test, testResult) {
        const result = this.results.get(test.path);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - result.startTime) / 1e6; // Convert to ms

        // Extract performance measurements from test results
        testResult.testResults.forEach(assertion => {
            if (assertion.performanceMeasurements) {
                result.measurements.push(...assertion.performanceMeasurements);
            }
        });

        result.duration = duration;
        result.success = testResult.numFailingTests === 0;
        result.failureMessages = testResult.failureMessages;
    }

    onRunComplete() {
        console.log('Performance Test Results');
        console.log('=======================\n');

        let allTestsPassed = true;
        const thresholds = this._globalConfig.globals.PERFORMANCE_THRESHOLDS;

        this.results.forEach(result => {
            console.log(`Test: ${result.name}`);
            console.log(`Duration: ${result.duration.toFixed(2)}ms`);
            
            if (result.measurements.length > 0) {
                console.log('\nPerformance Measurements:');
                result.measurements.forEach(measurement => {
                    const passed = this._checkThresholds(measurement, thresholds);
                    if (!passed) allTestsPassed = false;

                    console.log(`\n  ${measurement.name}:`);
                    Object.entries(measurement.metrics).forEach(([key, value]) => {
                        const threshold = thresholds[key];
                        const status = threshold ? (value <= threshold ? '✓' : '✗') : '-';
                        console.log(`    ${key}: ${value} ${status}`);
                    });
                });
            }

            if (!result.success) {
                allTestsPassed = false;
                console.log('\nFailures:');
                result.failureMessages.forEach(msg => console.log(`  ${msg}`));
            }

            console.log('\n-------------------\n');
        });

        const summary = `Performance Test Summary: ${allTestsPassed ? 'PASSED' : 'FAILED'}`;
        console.log('='.repeat(summary.length));
        console.log(summary);
        console.log('='.repeat(summary.length));
    }

    _checkThresholds(measurement, thresholds) {
        return Object.entries(measurement.metrics).every(([key, value]) => {
            const threshold = thresholds[key];
            return !threshold || value <= threshold;
        });
    }
}

module.exports = PerformanceReporter;