@echo off
echo ================================================================
echo     ENHANCED BRIDGE DESIGN APPLICATION - MAIN LAUNCHER
echo     Complete Professional Bridge Design with Abutments
echo ================================================================
echo.
echo Starting Enhanced Bridge Designer...
echo.
echo FEATURES INCLUDED:
echo - Complete Bridge Design Analysis
echo - Type-1 Battered Face Abutments  
echo - Type-2 Cantilever Abutments
echo - Pier Design with Detailed Geometry
echo - Foundation Optimization
echo - Comprehensive Cost Estimation
echo - Professional Reports and Export
echo.
echo Web Application Loading...
echo.

streamlit run streamlit_enhanced_bridge_app.py --server.port 8506 --server.headless false

echo.
echo Application closed.
pause