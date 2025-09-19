@echo off
echo ================================================
echo   COMPREHENSIVE ABUTMENT DESIGN APPLICATION
echo   Professional Bridge Abutment Design System  
echo ================================================
echo.
echo Starting Comprehensive Abutment Designer...
echo.
echo Features:
echo - Type-1 Battered Face Abutments (Gravity)
echo - Type-2 Cantilever Abutments (L-Shaped)
echo - Earth Pressure Analysis (Rankine Theory)
echo - Stability Checks (Overturning, Sliding, Bearing)
echo - Reinforcement Design and Bar Schedules
echo - Professional Drawings and Cost Estimation
echo - Export to PDF, Excel, and DXF formats
echo.
echo Please wait while the application loads...
echo.

streamlit run comprehensive_abutment_design_app.py --server.port 8504 --server.headless false

echo.
echo Application closed.
pause