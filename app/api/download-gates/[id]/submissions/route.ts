import { NextResponse } from 'next/server';

export async function GET() {
  // Mock submissions
  const submissions = [
    {
      id: 'sub1',
      email: 'fan1@example.com',
      firstName: 'John',
      soundcloudRepostVerified: true,
      soundcloudFollowVerified: true,
      spotifyConnected: false,
      downloadCompleted: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sub2',
      email: 'dj_fan@gmail.com',
      firstName: 'Maria',
      soundcloudRepostVerified: true,
      soundcloudFollowVerified: false,
      spotifyConnected: true,
      downloadCompleted: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sub3',
      email: 'viking_fan@outlook.com',
      firstName: 'Ragnar',
      soundcloudRepostVerified: true,
      soundcloudFollowVerified: true,
      spotifyConnected: true,
      downloadCompleted: true,
      createdAt: new Date().toISOString()
    }
  ];

  return NextResponse.json(submissions);
}
