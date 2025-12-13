#!/bin/bash
cd /home/kavia/workspace/code-generation/windows-desktop-emulator-296601-296612/kavia_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

