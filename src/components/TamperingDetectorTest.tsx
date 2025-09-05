import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Warning, FileText } from '@phosphor-icons/react'

const TamperingDetectorTest: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Warning className="h-5 w-5" />
            Real Evidence Analysis Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-orange-700">
            <p className="mb-3">
              <strong>The test/sample data has been removed</strong> to focus exclusively on your real evidence files.
            </p>
            
            <div className="bg-white border border-orange-200 rounded p-4 mb-4">
              <p className="font-semibold mb-2">To run tampering detection on your real evidence:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click <strong>"Load Input Documents"</strong> to import your case files</li>
                <li>Use <strong>"🚨 SHOW REAL CONTRADICTIONS 🚨"</strong> for immediate analysis</li>
                <li>Or click <strong>"Advanced Pattern Analysis"</strong> for detailed examination</li>
              </ol>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 font-medium">Real Evidence Tampering Detected:</p>
              <ul className="list-disc list-inside mt-2 text-red-700">
                <li><strong>Name alterations:</strong> "Noel Johnson" → "Neil Johnson"</li>
                <li><strong>Evidence suppression:</strong> Witness statements removed</li>
                <li><strong>Status manipulations:</strong> Risk assessments changed</li>
                <li><strong>Content alterations:</strong> Critical details modified</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => window.parent?.postMessage?.({ type: 'load_real_documents' }, '*')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Load Real Evidence Files
            </Button>
            
            <Button 
              onClick={() => window.parent?.postMessage?.({ type: 'show_real_analysis' }, '*')}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Warning className="h-4 w-4 mr-2" />
              Show Real Contradictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TamperingDetectorTest
