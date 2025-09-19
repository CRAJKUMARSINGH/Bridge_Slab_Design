import os
import json
from typing import Dict, List, Any
import subprocess
from pathlib import Path

class DocContentExtractor:
    def __init__(self):
        self.doc_files = []
        self.extracted_content = {}
        self.find_all_doc_files()
        
    def find_all_doc_files(self):
        """Find all DOC files in the project"""
        for root, dirs, files in os.walk('PROJECT FILES USED'):
            for file in files:
                if file.lower().endswith('.doc'):
                    full_path = os.path.join(root, file)
                    self.doc_files.append({
                        'path': full_path,
                        'filename': file,
                        'directory': os.path.dirname(full_path),
                        'size_kb': os.path.getsize(full_path) / 1024
                    })
        
        print(f"Found {len(self.doc_files)} DOC files")
        
    def categorize_doc_files(self):
        """Categorize DOC files by type"""
        categories = {
            'cover_pages': [],
            'index_files': [],
            'design_notes': [],
            'hydraulic_calculations': [],
            'comments_reviews': [],
            'other': []
        }
        
        for doc_file in self.doc_files:
            filename_lower = doc_file['filename'].lower()
            
            if 'cover' in filename_lower:
                categories['cover_pages'].append(doc_file)
            elif 'index' in filename_lower:
                categories['index_files'].append(doc_file)
            elif 'design notes' in filename_lower or 'design note' in filename_lower:
                categories['design_notes'].append(doc_file)
            elif 'hydraulic' in filename_lower:
                categories['hydraulic_calculations'].append(doc_file)
            elif 'comment' in filename_lower or 'review' in filename_lower:
                categories['comments_reviews'].append(doc_file)
            else:
                categories['other'].append(doc_file)
        
        return categories
    
    def try_extract_text_content(self, doc_path: str) -> str:
        """Try multiple methods to extract text from DOC files"""
        text_content = ""
        
        # Method 1: Try using python-docx2txt (if available)
        try:
            # import docx2txt  # Optional dependency
            # text_content = docx2txt.process(doc_path)
            # if text_content.strip():
            #     return text_content
            pass
        except ImportError:
            pass
        except Exception:
            pass
        
        # Method 2: Try using antiword (if available on Windows)
        try:
            result = subprocess.run(['antiword', doc_path], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                text_content = result.stdout
                if text_content.strip():
                    return text_content
        except Exception:
            pass
        
        # Method 3: Basic file info if text extraction fails
        return f"[Binary DOC file - {os.path.basename(doc_path)} - {os.path.getsize(doc_path)/1024:.1f} KB]"
    
    def analyze_file_structure(self, doc_file: Dict) -> Dict[str, Any]:
        """Analyze DOC file structure and extract metadata"""
        analysis = {
            'filename': doc_file['filename'],
            'path': doc_file['path'],
            'directory': doc_file['directory'],
            'size_kb': doc_file['size_kb'],
            'project_context': self.determine_project_context(doc_file['path']),
            'file_type': self.determine_file_type(doc_file['filename']),
            'content_preview': self.try_extract_text_content(doc_file['path'])[:500] + "..." if len(self.try_extract_text_content(doc_file['path'])) > 500 else self.try_extract_text_content(doc_file['path'])
        }
        
        return analysis
    
    def determine_project_context(self, file_path: str) -> str:
        """Determine which project/bridge the DOC file belongs to"""
        path_parts = file_path.split(os.sep)
        
        if 'Bundan River Bridge TAD' in file_path:
            return 'Bundan River Bridge TAD'
        elif 'KHERWARA BRIDGE' in file_path:
            return 'Kherwara Bridge (SOM River)'
        elif 'PARASRAM BRIDGE' in file_path:
            return 'Parasram Bridge Projects'
        elif 'UIT BRIDGES' in file_path:
            # Further categorize UIT bridges
            if 'Police Chowki' in file_path:
                return 'UIT - Bridge Near Police Chowki'
            elif 'NAVRATNA' in file_path:
                return 'UIT - Navratna Complex Bridge'
            elif 'ALU FACTORY' in file_path:
                return 'UIT - Bridge Near Alu Factory'
            elif 'SISARAMA' in file_path:
                return 'UIT - Sisarama Bridge'
            elif 'AYAD RIVER' in file_path or 'MAHARASHTRA BHAWAN' in file_path:
                return 'UIT - Ayad River Bridge (Maharashtra Bhawan)'
            elif 'Sukanaka' in file_path:
                return 'UIT - Sukanaka Bridge'
            elif 'SYHON BEDLA' in file_path:
                return 'UIT - Syphon Bedla Road Bridge'
            else:
                return 'UIT - Other Bridge'
        elif 'CHITORGARH PWD' in file_path:
            return 'Chitorgarh PWD Projects'
        else:
            return 'Other Project'
    
    def determine_file_type(self, filename: str) -> str:
        """Determine the type/purpose of the DOC file"""
        filename_lower = filename.lower()
        
        if 'cover' in filename_lower:
            return 'Cover Page'
        elif 'index' in filename_lower:
            return 'Index/Contents'
        elif 'design notes' in filename_lower or 'design note' in filename_lower:
            return 'Design Notes'
        elif 'hydraulic' in filename_lower:
            return 'Hydraulic Calculations'
        elif 'comment' in filename_lower or 'review' in filename_lower:
            return 'Comments/Reviews'
        elif 'clarification' in filename_lower:
            return 'Design Clarifications'
        else:
            return 'Technical Document'
    
    def extract_all_content(self) -> Dict[str, Any]:
        """Extract content from all DOC files"""
        categories = self.categorize_doc_files()
        
        extracted_data = {
            'extraction_summary': {
                'total_files': len(self.doc_files),
                'categories': {cat: len(files) for cat, files in categories.items()},
                'extraction_timestamp': str(Path(__file__).stat().st_mtime)
            },
            'by_category': {},
            'by_project': {},
            'file_details': []
        }
        
        # Process by categories
        for category, files in categories.items():
            extracted_data['by_category'][category] = []
            for doc_file in files:
                analysis = self.analyze_file_structure(doc_file)
                extracted_data['by_category'][category].append(analysis)
                extracted_data['file_details'].append(analysis)
        
        # Group by project
        projects = {}
        for doc_file in self.doc_files:
            analysis = self.analyze_file_structure(doc_file)
            project = analysis['project_context']
            
            if project not in projects:
                projects[project] = []
            projects[project].append(analysis)
        
        extracted_data['by_project'] = projects
        
        return extracted_data
    
    def create_doc_content_summary(self) -> Dict[str, Any]:
        """Create a comprehensive summary of all DOC content"""
        all_content = self.extract_all_content()
        
        # Create summary statistics
        summary = {
            'overview': {
                'total_doc_files': len(self.doc_files),
                'total_size_mb': sum(df['size_kb'] for df in self.doc_files) / 1024,
                'projects_covered': len(all_content['by_project']),
                'document_types': len(all_content['by_category'])
            },
            'project_breakdown': {
                project: {
                    'file_count': len(files),
                    'total_size_kb': sum(f['size_kb'] for f in files),
                    'document_types': list(set(f['file_type'] for f in files))
                }
                for project, files in all_content['by_project'].items()
            },
            'content_types': {
                category: {
                    'count': len(files),
                    'representative_files': [f['filename'] for f in files[:3]]
                }
                for category, files in all_content['by_category'].items()
            },
            'detailed_content': all_content
        }
        
        return summary
    
    def save_extracted_content(self, output_file: str = 'extracted_doc_content.json'):
        """Save extracted DOC content to JSON file"""
        content_summary = self.create_doc_content_summary()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(content_summary, f, indent=2, default=str)
        
        return output_file, content_summary

if __name__ == "__main__":
    print("Starting DOC Content Extraction...")
    
    extractor = DocContentExtractor()
    output_file, summary = extractor.save_extracted_content()
    
    print(f"\n=== DOC CONTENT EXTRACTION COMPLETE ===")
    print(f"Output file: {output_file}")
    print(f"\nSummary:")
    print(f"Total DOC files: {summary['overview']['total_doc_files']}")
    print(f"Total size: {summary['overview']['total_size_mb']:.1f} MB")
    print(f"Projects covered: {summary['overview']['projects_covered']}")
    
    print(f"\nProject Breakdown:")
    for project, details in summary['project_breakdown'].items():
        print(f"  {project}: {details['file_count']} files ({details['total_size_kb']:.1f} KB)")
    
    print(f"\nDocument Types:")
    for doc_type, details in summary['content_types'].items():
        print(f"  {doc_type}: {details['count']} files")