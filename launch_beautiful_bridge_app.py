#!/usr/bin/env python3
"""
LAUNCH BEAUTIFUL BRIDGE DESIGN APPLICATION
==========================================

Main launch script for the Beautiful Slab Bridge Design Application
Integrates all components and provides a seamless user experience

Features:
- 75+ comprehensive Excel sheets
- Mixed orientation PDF generation
- Type-1 and Type-2 abutment designs
- Professional UI with progress tracking
- Complete design workflow

Author: Beautiful Bridge Design App Launcher
Version: 1.0.0 - Complete Integration
"""

import sys
import os
import subprocess
import streamlit as st
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_packages = [
        'streamlit',
        'pandas',
        'numpy',
        'plotly',
        'openpyxl',
        'reportlab',
        'matplotlib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_bridge_slab_designer():
    """Check if BridgeSlabDesigner module exists"""
    bridge_designer_path = Path("BridgeSlabDesigner")
    
    if not bridge_designer_path.exists():
        print("❌ BridgeSlabDesigner module not found!")
        print("   Please ensure the BridgeSlabDesigner folder exists in the current directory.")
        return False
    
    required_files = [
        "app.py",
        "bridge_components.py",
        "calculation_engine.py",
        "excel_generator_75_sheets_working.py",
        "pdf_generator.py",
        "abutment_type_selector.py",
        "ui_components.py",
        "session_manager.py",
        "parameter_validation.py",
        "project_templates.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not (bridge_designer_path / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files in BridgeSlabDesigner:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    return True

def launch_application():
    """Launch the Beautiful Bridge Design Application"""
    
    print("🌉 Beautiful Slab Bridge Design Application")
    print("=" * 50)
    
    # Check dependencies
    print("🔍 Checking dependencies...")
    if not check_dependencies():
        return False
    
    # Check BridgeSlabDesigner module
    print("🔍 Checking BridgeSlabDesigner module...")
    if not check_bridge_slab_designer():
        return False
    
    print("✅ All checks passed!")
    print("\n🚀 Launching Beautiful Bridge Design Application...")
    print("   - 75+ comprehensive Excel sheets")
    print("   - Mixed orientation PDF generation")
    print("   - Type-1 and Type-2 abutment designs")
    print("   - Professional UI with progress tracking")
    print("   - Complete design workflow")
    print("\n📱 The application will open in your default web browser...")
    print("   Press Ctrl+C to stop the application")
    print("\n" + "=" * 50)
    
    # Launch the application
    try:
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", 
            "beautiful_slab_bridge_design_app_corrected.py",
            "--server.port", "8501",
            "--server.address", "localhost"
        ])
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"\n❌ Error launching application: {e}")
        return False
    
    return True

def show_application_info():
    """Show application information"""
    print("""
🌉 BEAUTIFUL SLAB BRIDGE DESIGN APPLICATION
==========================================

Complete professional bridge design application with:

📊 EXCEL GENERATION (75+ SHEETS):
   • Project Information (15 sheets)
   • Hydraulic Analysis (15 sheets) 
   • Structural Design (20 sheets)
   • Quantities & Costs (15 sheets)
   • Documentation (10 sheets)

📄 PDF GENERATION:
   • Mixed A4 portrait/landscape layouts
   • Professional formatting
   • One-click generation
   • Comprehensive coverage

🏛️ ABUTMENT DESIGNS:
   • Type-1 Battered Abutment (UIT Bridges)
   • Type-2 Cantilever Abutment (Chittorgarh)
   • Complete design and analysis
   • Professional drawings

🎨 FEATURES:
   • Beautiful modern UI
   • Progress tracking
   • Template loading
   • Real-time validation
   • Professional formatting
   • Complete workflow

📁 REFERENCE PROJECTS:
   • UIT Bridges Template
   • Chittorgarh PWD Template
   • Kherwara Bridge Template
   • Parasram Bridge Template
   • Devka Bridge Template

🔧 TECHNICAL:
   • Based on existing repository logic
   • No external technical knowledge added
   • Maintains originality
   • Professional implementation

Author: Beautiful Bridge Design App
Version: 1.0.0 - Complete Integration
""")

def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == "--info":
        show_application_info()
        return
    
    print("🌉 Beautiful Slab Bridge Design Application Launcher")
    print("=" * 60)
    
    # Show application info
    show_application_info()
    
    # Ask user if they want to continue
    try:
        response = input("\n🚀 Do you want to launch the application? (y/n): ").lower().strip()
        if response not in ['y', 'yes']:
            print("👋 Application launch cancelled")
            return
    except KeyboardInterrupt:
        print("\n👋 Application launch cancelled")
        return
    
    # Launch the application
    success = launch_application()
    
    if success:
        print("\n✅ Application launched successfully!")
    else:
        print("\n❌ Failed to launch application")

if __name__ == "__main__":
    main()
