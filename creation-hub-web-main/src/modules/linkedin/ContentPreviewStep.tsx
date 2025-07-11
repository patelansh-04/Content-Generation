import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { ThumbsUp, MessageCircle, Repeat2, Send, Download, ArrowLeft } from 'lucide-react';
import type { FormData } from './LinkedInAutomationForm';
import { useLinkedInFormContext } from './LinkedInFormContext';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export interface ContentPreviewStepProps {
  formData: FormData;
  onPrev: () => void;
  onPost?: () => void;
}

const ContentPreviewStep = ({ formData, onPrev }: ContentPreviewStepProps) => {
  const { setComingFromValidation } = useLinkedInFormContext();
  
  // Replace with your actual LinkedIn webhook URL
  const N8N_LINKEDIN_WEBHOOK_URL = "https://n8n.getondataconsulting.in/webhook/likedinPost";

  const handleBackToPromptEditor = () => {
    setComingFromValidation(true);
    onPrev();
  };

  const handlePostToLinkedIn = async () => {
    try {
      let body;
      let headers;
      if (formData.mediaFile) {
        // If media file is present, use FormData to send binary
        body = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'mediaFile' && value) {
            body.append('mediaFile', value as File);
          } else if (value !== undefined && value !== null) {
            body.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
          }
        });
        headers = undefined; // Let browser set multipart/form-data
      } else {
        // No media file, send as JSON
        body = JSON.stringify(formData);
        headers = { "Content-Type": "application/json" };
      }
      const response = await fetch(N8N_LINKEDIN_WEBHOOK_URL, {
        method: "POST",
        headers,
        body,
      });
      if (!response.ok) throw new Error("Failed to post to LinkedIn");
      alert('Post scheduled for LinkedIn! 🎉');
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100); // Give alert time to show before reload
    } catch (error) {
      alert('Error posting to LinkedIn. Please try again.');
    }
  };

  const handleDownloadContent = async () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "LINKEDIN POST PREVIEW",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 300,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Posted by: ",
                  bold: true,
                }),
                new TextRun({
                  text: formData.postAs === 'company' && formData.companyName 
                    ? formData.companyName 
                    : 'Your Name',
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Target Audience: ",
                  bold: true,
                }),
                new TextRun({
                  text: formData.targetAudience || 'Not specified',
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Generated on: ",
                  bold: true,
                }),
                new TextRun({
                  text: formattedDate,
                }),
              ],
              spacing: {
                after: 400,
              },
            }),
            new Paragraph({
              text: "POST CONTENT:",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                after: 200,
              },
            }),
            // Split content by lines and create separate paragraphs to preserve formatting
            ...(formData.approvalResponse || 'No approval response yet.')
              .split('\n')
              .map(line => new Paragraph({
                text: line || ' ', // Empty line becomes space to maintain spacing
                spacing: {
                  after: line.trim() === '' ? 100 : 200, // Less spacing for empty lines
                  line: 360, // 1.5 line spacing
                },
              })),
            ...(formData.mediaFile || formData.mediaUrl ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "[Media attachment included]",
                    italics: true,
                    color: "666666",
                  }),
                ],
                spacing: {
                  after: 300,
                },
              })
            ] : []),
            new Paragraph({
              text: "---",
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              text: "Generated by Creation Hub",
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200,
              },
            }),
          ],
        },
      ],
    });

    // Generate and download the document
    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `linkedin-post-${currentDate.toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating document. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Final Content Preview</h2>
        <p className="text-gray-600">Review your generated LinkedIn content before posting</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-500 text-white font-semibold">
                  {formData.postAs === 'company' && formData.companyName 
                    ? formData.companyName.charAt(0).toUpperCase()
                    : 'U'
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {formData.postAs === 'company' && formData.companyName 
                    ? formData.companyName 
                    : 'Your Name'
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {formData.targetAudience} • Now
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-gray-900 whitespace-pre-line leading-relaxed">
                {formData.approvalResponse
                  ? formData.approvalResponse
                  //     .split(/\n\n/)
                  //     .map(line => line.replace(/^.*?:\s?/s, ''))
                  //     .join('\n\n')
                  : 'No approval response yet.'}
              </div>
            </div>

            {(formData.mediaFile || formData.mediaUrl) && (
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                  📷 Media attachment will appear here
                </div>
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-gray-500">
                <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span>Repost</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Generate Status:</div>
              <div className="text-sm font-medium text-green-600">
                Content ready for posting
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Next Step:</div>
              <div className="text-sm text-gray-600">
                Review content and post to LinkedIn
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleBackToPromptEditor} 
            variant="outline"
            className="px-8 py-2"
          >
            ← Back to Prompt Editor
          </Button>
          <div className="flex space-x-3">
            <Button 
              onClick={handleDownloadContent}
              variant="outline"
              className="px-8 py-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download as Word
            </Button>
            <Button 
              onClick={handlePostToLinkedIn}
              className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white"
            >
              Post to LinkedIn ✅
            </Button>
          </div>
        </div>
      </div>
      
      {/* Back to Dashboard Button */}
      <div className="flex justify-center mt-8 mb-6">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ContentPreviewStep;
