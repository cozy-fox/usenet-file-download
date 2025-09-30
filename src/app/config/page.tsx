'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface Config {
  indexer: {
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    timeout: number;
    type: string;
    categories: string[];
  };
  sabnzbd: {
    url: string;
    apiKey: string;
  };
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showIndexerApiKey, setShowIndexerApiKey] = useState(false);
  const [showSabnzbdApiKey, setShowSabnzbdApiKey] = useState(false);

  // Load config on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof Config, field: string, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  const updateCategories = (categoriesString: string) => {
    if (!config) return;
    
    const categories = categoriesString.split(',').map(cat => cat.trim()).filter(cat => cat);
    setConfig({
      ...config,
      indexer: {
        ...config.indexer,
        categories,
      },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">Failed to load configuration</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuration</h1>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Indexer Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Indexer Configuration</CardTitle>
            <CardDescription>Configure your Usenet indexer settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={config.indexer.name}
                onChange={(e) => updateConfig('indexer', 'name', e.target.value)}
                placeholder="Indexer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                value={config.indexer.url}
                onChange={(e) => updateConfig('indexer', 'url', e.target.value)}
                placeholder="https://indexer.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <div className="relative">
                <Input
                  type={showIndexerApiKey ? "text" : "password"}
                  value={config.indexer.apiKey}
                  onChange={(e) => updateConfig('indexer', 'apiKey', e.target.value)}
                  placeholder="Your API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowIndexerApiKey(!showIndexerApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showIndexerApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
              <Input
                type="number"
                value={config.indexer.timeout}
                onChange={(e) => updateConfig('indexer', 'timeout', parseInt(e.target.value))}
                min="1"
                max="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Input
                value={config.indexer.type}
                onChange={(e) => updateConfig('indexer', 'type', e.target.value)}
                placeholder="newznab"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categories (comma-separated)</label>
              <Input
                value={config.indexer.categories.join(', ')}
                onChange={(e) => updateCategories(e.target.value)}
                placeholder="2000, 5000, 3000"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={config.indexer.enabled}
                onChange={(e) => updateConfig('indexer', 'enabled', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Enabled
              </label>
            </div>
          </CardContent>
        </Card>

        {/* SABnzbd Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>SABnzbd Configuration</CardTitle>
            <CardDescription>Configure your SABnzbd downloader settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                value={config.sabnzbd.url}
                onChange={(e) => updateConfig('sabnzbd', 'url', e.target.value)}
                placeholder="http://localhost:8080"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <div className="relative">
                <Input
                  type={showSabnzbdApiKey ? "text" : "password"}
                  value={config.sabnzbd.apiKey}
                  onChange={(e) => updateConfig('sabnzbd', 'apiKey', e.target.value)}
                  placeholder="Your SABnzbd API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSabnzbdApiKey(!showSabnzbdApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSabnzbdApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
