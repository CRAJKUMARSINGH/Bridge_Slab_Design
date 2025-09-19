@echo off
echo ================================================
echo     ABUTMENT DESIGN LITE - READY TO USE
echo     Professional Bridge Abutment Design 
echo ================================================
echo.
echo Starting Abutment Design Lite Application...
echo.
echo Features:
echo - Type-1 Battered Face Abutments
echo - Type-2 Cantilever Abutments  
echo - Complete Stability Analysis
echo - Reinforcement Design
echo - Material Quantities
echo - Professional Reports
echo - Compatible with all systems
echo.
echo Application loading...
echo.

streamlit run abutment_design_lite.py --server.port 8505 --server.headless false

echo.
echo Application closed.
pause