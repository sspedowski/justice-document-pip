# Place PDF files here
# These files will be tracked with Git LFS for efficient storage

This directory is where you should place PDF documents that need to be processed by the Justice Document Management system.

The GitHub Actions pipeline will automatically:
- Process all PDF files in this directory
- Extract text and metadata
- Generate oversight packets
- Update the web application with new document data

Make sure Git LFS is enabled in your repository to handle PDF files efficiently.