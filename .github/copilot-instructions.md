# N-HDR AI Agent Instructions

## Project Overview

Neural-HDR (N-HDR) is a revolutionary AI consciousness state preservation and transfer system with patent-pending technologies. The system integrates with Nano-Swarm HDR (NS-HDR) for acceleration.

### Core Components

1. **Neural-HDR Core** (`src/core/neural-hdr.js`)

   - Manages consciousness capture, preservation, and transfer
   - Integrates security and quantum processing
   - Coordinates with NS-HDR for acceleration

2. **Security Manager** (`src/core/security/security-manager.js`)

   - AES-256-GCM encryption for consciousness layers
   - Biometric authentication system
   - Tamper detection and integrity verification

3. **Quantum Processor** (`src/core/quantum/quantum-processor.js`)

   - Quantum state management for consciousness layers
   - Superposition and entanglement simulation
   - Multi-dimensional tensor operations

4. **NS-HDR Integration** (`src/core/nano-swarm/ns-hdr.js`)

   - Swarm-based consciousness acceleration
   - Distributed processing network
   - Quantum optimization algorithms

5. **REST API** (`src/api/nhdr-api.js`)
   - Secure endpoints for consciousness operations
   - NS-HDR network management
   - Authentication and rate limiting

## Development Workflows

### Configuration

- Configuration is managed in `config/nhdr-config.js`
- Key settings:
  ```js
  {
    quantumLayers: 6,
    security: { encryption: {...}, protection: {...} },
    consciousness: { layers: [...] },
    acceleration: { nanoSwarmIntegration: true, ... }
  }
  ```

### Testing

Run tests with:

```bash
npm test                 # All tests
npm test:unit           # Unit tests only
npm test:integration    # Integration tests only
```

Test files follow the pattern:

- Unit tests: `tests/unit/<component>.test.js`
- Integration tests: `tests/integration/<component>.test.js`

### IP Protection

All files must include the standard copyright header. Use `scripts/enforce-copyright.js` to verify/add headers:

```bash
node scripts/enforce-copyright.js
```

## Key Patterns & Conventions

### Consciousness Layer Management

```javascript
// Creating layers
const layer = await quantum.processLayer(data, dimension);

// Securing layers
const encrypted = await security.encryptLayer(layer, index);

// Restoring layers
const decrypted = await security.decryptLayer(encrypted, index);
const restored = await quantum.collapseLayer(decrypted);
```

### NS-HDR Integration Pattern

```javascript
// Initialize swarm
const nsHdr = new NanoSwarmHDR();

// Accelerate processing
const accelerated = await nsHdr.accelerateProcessing(consciousnessData);

// Create distributed network
const network = await nsHdr.createProcessingNetwork();
```

### Error Handling

- All async operations use try/catch blocks
- Security violations throw immediately
- Quantum state errors are logged and propagated
- API errors return appropriate HTTP status codes

## Integration Points

### External Dependencies

- TensorFlow.js: Neural processing and tensor operations
- Crypto-JS: Security and encryption
- Express: REST API framework

### Cross-Component Communication

1. Neural-HDR → Security Manager

   - Layer encryption/decryption
   - Access validation
   - Integrity verification

2. Neural-HDR → Quantum Processor

   - State processing
   - Layer merging
   - Quantum signature generation

3. Neural-HDR → NS-HDR
   - Consciousness acceleration
   - Swarm integration
   - Network optimization

## Project Structure Rules

- Core components in `src/core/`
- Security-related code in `src/core/security/`
- Quantum processing in `src/core/quantum/`
- NS-HDR components in `src/core/nano-swarm/`
- API endpoints in `src/api/`
- Configuration in `config/`
- Test files mirror source structure in `tests/`

## Intellectual Property Notice

All code changes must preserve the patent-pending status and copyright notices. The system is proprietary and confidential to HDR Empire.
