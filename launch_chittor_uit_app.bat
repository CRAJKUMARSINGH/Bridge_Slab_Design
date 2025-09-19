@echo off
echo =========================================================
echo  CHITTOR & UIT BRIDGES STABILITY ANALYSIS DESIGNER
echo =========================================================
echo.
echo Starting bridge design application based on:
echo • CHITTOR: plus Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls
echo • UIT: Stability Analysis SUBMERSIBLE BRIDGE ACROSS AYAD RIVER.xls
echo.
echo Features:
echo • Complete formula wiring between sheets
echo • Central variables definition sheet  
echo • Cross-sheet references and dependencies
echo • Professional report generation
echo.
echo Press any key to launch the application...
pause >nul

cd /d "%~dp0"
streamlit run chittor_uit_stability_analysis_app.py --server.port 8502

echo.
echo Application closed. Press any key to exit...
pause >nul