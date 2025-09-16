#!/usr/bin/env python3
"""
TEST RUN: 10-Span, 10m Slab Bridge
Test the enhanced bridge design app with a 10-span, 10m effective span configuration
"""

from enhanced_bridge_design_app import EnhancedBridgeDesignApp, ConcreteGrade, SteelGrade

def create_10span_10m_bridge_test():
    """Create a 10-span, 10m effective span bridge design test"""
    
    # Initialize enhanced app
    app = EnhancedBridgeDesignApp()
    
    # Sample survey data (15 points as specified)
    sample_cross_section = []
    for i in range(15):
        sample_cross_section.append({
            'point_id': i + 1,
            'chainage': i * 5.0,  # 5m spacing as specified
            'left_distance': i * 5.0,
            'right_distance': (14 - i) * 5.0,
            'ground_level': 95.0 + i * 0.1,
            'bed_level': 94.0 + i * 0.05
        })
    
    # Sample longitudinal section (25m spacing)
    sample_longitudinal = []
    for i in range(20):  # More points for longer bridge
        sample_longitudinal.append({
            'chainage': i * 25.0,
            'ground_level': 95.0 + i * 0.2
        })
    
    # Input data for 10-span, 10m bridge
    app.input_survey_data(sample_cross_section, sample_longitudinal)
    
    app.input_project_parameters(
        bridge_name="10-Span 10m Slab Bridge Test",
        location="Test Location - 10 Span Configuration",
        effective_span=10.0,  # 10m effective span
        pier_spacing_cc=11.5,  # Slightly larger for 10m span
        bridge_width=12.0,
        pier_cap_width=15.0,
        num_spans=10,  # 10 spans
        skew_angle=0.0  # No skew for this test
    )
    
    app.input_hydraulic_parameters(
        discharge=1500.0,  # Higher discharge for longer bridge
        design_velocity=3.5,
        hfl=101.5,  # Slightly higher HFL
        manning_n=0.033
    )
    
    app.input_soil_parameters(
        safe_bearing_capacity=450,
        angle_of_friction=30,
        unit_weight=18.0
    )
    
    app.input_material_parameters(
        concrete_grade=ConcreteGrade.M25,
        steel_grade=SteelGrade.Fe415
    )
    
    # Run complete enhanced design
    results = app.design_bridge_complete()
    
    # Generate and print enhanced report
    report = app.generate_enhanced_design_report()
    print(report)
    
    # Export detailed results
    export_file = app.export_detailed_results("10span_10m_bridge_test_results.json")
    print(f"\n💾 10-Span Test results saved to: {export_file}")
    
    return app, results

if __name__ == "__main__":
    # Run 10-span, 10m bridge test
    print("🚀 Running 10-Span, 10m Slab Bridge Test...")
    print("Configuration: 10 spans × 10m effective span = 100m total length")
    print("="*80)
    
    app, results = create_10span_10m_bridge_test()
    
    print("\n🎯 10-SPAN BRIDGE TEST SUMMARY:")
    print(f"• Total Bridge Length: {results['project_info']['skew_angle']}° skew")
    print(f"• Number of Spans: 10")
    print(f"• Effective Span: 10.0m")
    print(f"• Total Project Cost: ₹{results['comprehensive_estimation']['total_project_cost']:,.0f}")
    print(f"• Concrete Required: {results['comprehensive_estimation']['material_summary']['total_concrete']:.1f} m³")
    print(f"• Steel Required: {results['comprehensive_estimation']['material_summary']['total_steel']:.1f} tonnes")
    print(f"• Number of Piers: 9 (for 10 spans)")
    print(f"• Recommended Abutment: {results['complete_abutment_design']['comparison_summary']['recommended_type']}")
    
    print("\n🏆 10-SPAN BRIDGE TEST COMPLETED SUCCESSFULLY!")
    print("✅ All calculations completed for 10-span configuration!")

