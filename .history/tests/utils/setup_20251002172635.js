/*
 * HDR Empire Framework - Jest Test Setup
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { registerPerformanceMatchers } from './custom-matchers.js';

// Register custom performance matchers globally
registerPerformanceMatchers();

// Additional global setup can be added here
console.log('✓ HDR Empire Framework test environment initialized');
console.log('✓ Custom performance matchers registered');
