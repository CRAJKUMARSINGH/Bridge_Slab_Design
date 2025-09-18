#!/usr/bin/env python3
"""
Generate Complete PDF Report for Bridge Design
Combines all design sheets into A4 portrait and landscape formats
"""

import os
import sys
from datetime import datetime

def main():
    """Generate complete PDF report from bridge design results"""
    
    print("📄 COMPREHENSIVE BRIDGE DESIGN PDF REPORT GENERATOR")
    print("="*60)
    
    # Check if results file exists
    results_file = r"c:\Users\Rajkumar\Bridge_Slab_Design\sample_slab_bridge_design_results.json"
    
    if not os.path.exists(results_file):
        print("❌ Bridge design results file not found!")
        print("📝 Please run the bridge design first:")
        print("   python sample_bridge_design_with_input.py")
        return
    
    print(f"✅ Found results file: {os.path.basename(results_file)}")
    
    try:
        # Import and run PDF generator
        from create_bridge_pdf_report import create_bridge_pdf_report
        
        print("🎨 Starting PDF report generation...")
        print("📄 Creating comprehensive report with all sheets...")
        
        # Generate PDF report
        pdf_filepath = create_bridge_pdf_report(results_file)
        
        print("\n🎯 PDF REPORT GENERATION COMPLETED!")
        print("="*50)
        print(f"📄 Report saved as: {os.path.basename(pdf_filepath)}")
        print(f"📁 Location: {pdf_filepath}")
        
        # Display report contents
        print("\n📋 REPORT CONTENTS:")
        print("• Page 1: Title Page with Project Overview")
        print("• Page 2: Project Summary & Parameters") 
        print("• Page 3: Cost Analysis & Material Quantities")
        print("• Page 4: Charts & Bridge Profile (Landscape)")
        
        print("\n✅ FEATURES INCLUDED:")
        print("• A4 Portrait and Landscape formats")
        print("• Professional layout and formatting")
        print("• Complete design data and calculations")
        print("• Material quantities and cost breakdown")
        print("• Visual charts and bridge profile diagram")
        print("• Design status and recommendations")
        
        # File size info
        file_size = os.path.getsize(pdf_filepath) / 1024  # KB
        print(f"\n📊 FILE INFO:")
        print(f"• File size: {file_size:.1f} KB")
        print(f"• Pages: 4 (Portrait + Landscape)")
        print(f"• Format: PDF (printable on A4)")
        
        print("\n🖨️ READY FOR PRINTING AND SUBMISSION!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("📥 Installing required packages...")
        
        # Install matplotlib if needed
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "matplotlib"])
            print("✅ Matplotlib installed successfully")
            print("🔄 Please run the script again")
        except Exception as install_error:
            print(f"❌ Installation failed: {install_error}")
        
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        print("💡 Please ensure the bridge design results are complete")

if __name__ == "__main__":
    main()