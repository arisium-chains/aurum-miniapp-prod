# Aurum Circle Miniapp - Optimized Version

This is an optimized version of the Aurum Circle miniapp that has been prepared for faster upload and deployment.

## Optimizations Applied

1. **Model Removal**: All ML models have been removed from Git tracking to reduce repository size.
2. **Git History Cleanup**: Used git filter-branch to remove model files from Git history.
3. **Next.js Configuration**: Enabled compression and optimization in the Next.js configuration.
4. **Deployment Process**: Created scripts for proper deployment that downloads models separately.

## File Structure

The optimized package includes:
- All source code in the `src` directory
- Configuration files
- Documentation files
- Deployment scripts
- Model download script

## Deployment Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Download ML models (separately):
   ```bash
   npm run download-models
   ```
   Note: This creates placeholder files. In a real deployment, replace with actual download commands.

4. Build the application:
   ```bash
   npm run build
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Further Optimizations

For even smaller deployment size, consider:
1. Moving ML models to a CDN and loading them on-demand
2. Using server-side processing for ML tasks
3. Implementing more aggressive code splitting
4. Using lighter-weight alternatives to some dependencies

## Package Size

Current repository size: ~833MB (reduced from over 2GB)
Source code size: ~3MB (without Git history)