@echo off
echo =====================================
echo Bridge Hydraulic Design System Launcher
echo =====================================
echo.
echo Available Applications (Matplotlib-Free):
echo.
echo 1. Enhanced System with DOC Integration (RECOMMENDED)
echo    - Complete Excel + DOC file analysis
echo    - 44 documents from 10 bridge projects
echo    - Advanced cross-validation
echo    Port: 8504
echo.
echo 2. Final Integrated Hydraulic System
echo    - Excel data integration + DOC support
echo    - Professional A4 reports
echo    Port: 8502
echo.
echo 3. Comprehensive Hydraulic App (Fixed)
echo    - Alternative interface
echo    Port: 8503
echo.
echo =====================================
echo Starting Enhanced System (Port 8504)...
echo =====================================
echo.
streamlit run enhanced_hydraulic_with_docs.py --server.port 8504
pause