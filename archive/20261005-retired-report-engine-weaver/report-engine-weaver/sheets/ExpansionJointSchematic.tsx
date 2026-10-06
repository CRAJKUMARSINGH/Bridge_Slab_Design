import React from "react";
import { Page, SectionHead, Prose } from "./ReportUI";

export function ExpansionJointSchematic() {
  return (
    <Page id="s-exp-joint">
      <div style={{ borderTop: "2px solid orchid", margin: "10px 0 14px" }} />
      <SectionHead>Sheet: Expansion Joint Schematic & Details</SectionHead>
      <Prose>
        Expansion joints accommodate movements from temperature changes, shrinkage, and creep in the deck slab, preventing structural distress at the abutment junctions and pier supports.
      </Prose>
      
      <div className="flex justify-center my-8">
        <div className="relative border-2 border-gray-400 max-w-2xl w-full p-8 bg-gray-50 flex flex-col items-center">
          <div className="mb-4 font-bold text-gray-700">Strip Seal Expansion Joint (Typical)</div>
          
          {/* Schematic graphic using CSS */}
          <div className="relative h-40 w-full flex justify-center items-end border-b-4 border-gray-600 pb-2">
            
            {/* Slab Left */}
            <div className="absolute left-0 bottom-0 h-16 w-[45%] bg-blue-100 border-2 border-blue-400 rounded-bl flex items-center justify-center">
              <span className="text-xs text-blue-800 font-semibold">Deck Slab</span>
            </div>
            
            {/* Gap */}
            <div className="absolute left-[45%] bottom-0 h-16 w-[10%] border-x-2 border-dashed border-gray-400 bg-gray-200">
              <div className="w-full text-center mt-2 text-xs font-bold text-red-600">GAP</div>
            </div>
            
            {/* Slab Right */}
            <div className="absolute right-0 bottom-0 h-16 w-[45%] bg-blue-100 border-2 border-blue-400 rounded-br flex items-center justify-center">
              <span className="text-xs text-blue-800 font-semibold">Dirt Wall / Adjacent Span</span>
            </div>

            {/* Elastomeric Seal */}
            <div className="absolute left-[45%] bottom-16 h-4 w-[10%] bg-zinc-800 rounded-t border-2 border-black z-10" />
            
            {/* Edge Beams */}
            <div className="absolute left-[40%] bottom-14 h-6 w-[5%] bg-gray-500 rounded z-0" />
            <div className="absolute right-[40%] bottom-14 h-6 w-[5%] bg-gray-500 rounded z-0" />
            
            {/* Anchorages */}
            <div className="absolute left-[35%] bottom-4 h-2 w-[10%] bg-yellow-600 rounded rotate-12" />
            <div className="absolute right-[35%] bottom-4 h-2 w-[10%] bg-yellow-600 rounded -rotate-12" />
          </div>
          
          <div className="mt-8 text-sm text-gray-600 w-full">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Gap Width:</strong> Nominally 40mm at 15Â°C mean temperature.</li>
              <li><strong>Edge Beams:</strong> Steel profiles embedded in elastomeric concrete.</li>
              <li><strong>Anchorage:</strong> Looped or headed shear studs welded to the edge beam and embedded in the deck reinforcement.</li>
              <li><strong>Seal:</strong> Neoprene gland to prevent water/debris ingress.</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Prose>
        The strip seal type expansion joint is provided at both abutments. No gaps are provided over the piers for continuous bridge decks, except where specifically modeled.
      </Prose>
    </Page>
  );
}


