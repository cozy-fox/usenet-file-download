import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'config.json');

// GET - Read config.json or create default if not exists
export async function GET() {
  try {
    // Check if config file exists
    try {
      await fs.access(CONFIG_PATH);
      // File exists, read it
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      return NextResponse.json(config);
    } catch (accessError) {
      // File doesn't exist, create default config
      const defaultConfig = {
        indexer: {
          name: "",
          url: "",
          apiKey: "",
          enabled: true,
          timeout: 30,
          type: "newznab",
          categories: []
        },
        sabnzbd: {
          url: "",
          apiKey: ""
        }
      };

      // Create the config file with default values
      await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf8');
      
      return NextResponse.json(defaultConfig);
    }
  } catch (error) {
    console.error('Error reading/creating config:', error);
    return NextResponse.json(
      { error: 'Failed to read/create configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update config.json
export async function PUT(req: NextRequest) {
  try {
    const updatedConfig = await req.json();
    
    // Validate the config structure
    if (!updatedConfig.indexer || !updatedConfig.sabnzbd) {
      return NextResponse.json(
        { error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { indexer, sabnzbd } = updatedConfig;
    
    if (!indexer.name || !indexer.url || !indexer.apiKey) {
      return NextResponse.json(
        { error: 'Indexer config is missing required fields' },
        { status: 400 }
      );
    }

    if (!sabnzbd.url) {
      return NextResponse.json(
        { error: 'SABnzbd URL is required' },
        { status: 400 }
      );
    }

    // Write updated config to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
