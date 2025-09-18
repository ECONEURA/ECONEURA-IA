/**
 * SOCIAL MEDIA MANAGEMENT DASHBOARD
 * 
 * PR-57: Dashboard completo para gestión de redes sociales
 * 
 * Funcionalidades:
 * - Gestión de cuentas sociales
 * - Creación y programación de posts
 * - Monitoreo de menciones
 * - Analytics y métricas
 * - Gestión de campañas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, TrendingUp, MessageSquare, Share2, Heart, Eye, BarChart3, Plus, Edit, Trash2, Send, Schedule } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialPost {
  id: string;
  accountId: string;
  platform: string;
  type: string;
  status: string;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  scheduledAt?: string;
  publishedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    engagementRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SocialMention {
  id: string;
  platform: string;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  url: string;
  publishedAt: string;
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
    score: number;
  };
  priority: string;
  category: string;
  isResponded: boolean;
}

interface SocialCampaign {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  startDate: string;
  endDate?: string;
  status: string;
  metrics?: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
}

interface SocialStatistics {
  totalAccounts: number;
  accountsByPlatform: Record<string, number>;
  totalPosts: number;
  postsByPlatform: Record<string, number>;
  postsByStatus: Record<string, number>;
  totalMentions: number;
  mentionsByPlatform: Record<string, number>;
  totalCampaigns: number;
  campaignsByStatus: Record<string, number>;
  averageEngagementRate: number;
  topPerformingPosts: SocialPost[];
}

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-600' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-black' },
  { value: 'pinterest', label: 'Pinterest', color: 'bg-red-500' },
  { value: 'snapchat', label: 'Snapchat', color: 'bg-yellow-500' },
  { value: 'telegram', label: 'Telegram', color: 'bg-blue-500' },
  { value: 'discord', label: 'Discord', color: 'bg-indigo-600' }
];

const POST_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'live', label: 'Live' },
  { value: 'poll', label: 'Poll' },
  { value: 'event', label: 'Event' },
  { value: 'link', label: 'Link' }
];

const POST_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-500' },
  { value: 'published', label: 'Published', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'deleted', label: 'Deleted', color: 'bg-gray-700' }
];

export default function SocialMediaManagementDashboard() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [mentions, setMentions] = useState<SocialMention[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [statistics, setStatistics] = useState<SocialStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: '',
    username: '',
    displayName: '',
    profileUrl: '',
    avatarUrl: '',
    bio: ''
  });
  const [newPost, setNewPost] = useState({
    accountId: '',
    platform: '',
    type: 'text',
    content: '',
    mediaUrls: [] as string[],
    hashtags: [] as string[],
    mentions: [] as string[],
    scheduledAt: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const accountsResponse = await fetch('/api/social-media/accounts');
      const accountsData = await accountsResponse.json();
      if (accountsData.success) {
        setAccounts(accountsData.data.accounts);
      }

      // Load posts
      const postsResponse = await fetch('/api/social-media/posts');
      const postsData = await postsResponse.json();
      if (postsData.success) {
        setPosts(postsData.data.posts);
      }

      // Load mentions
      const mentionsResponse = await fetch('/api/social-media/mentions');
      const mentionsData = await mentionsResponse.json();
      if (mentionsData.success) {
        setMentions(mentionsData.data.mentions);
      }

      // Load campaigns
      const campaignsResponse = await fetch('/api/social-media/campaigns');
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.success) {
        setCampaigns(campaignsData.data.campaigns);
      }

      // Load statistics
      const statsResponse = await fetch('/api/social-media/statistics');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('Error loading social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/social-media/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      });

      const data = await response.json();
      if (data.success) {
        setAccounts([...accounts, data.data]);
        setNewAccount({
          platform: '',
          username: '',
          displayName: '',
          profileUrl: '',
          avatarUrl: '',
          bio: ''
        });
        setShowCreateAccount(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const response = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      const data = await response.json();
      if (data.success) {
        setPosts([...posts, data.data]);
        setNewPost({
          accountId: '',
          platform: '',
          type: 'text',
          content: '',
          mediaUrls: [],
          hashtags: [],
          mentions: [],
          scheduledAt: ''
        });
        setShowCreatePost(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social-media/posts/${postId}/publish`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  const getPlatformColor = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    return platformData?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const statusData = POST_STATUSES.find(s => s.value === status);
    return statusData?.color || 'bg-gray-500';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading social media data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Management</h1>
          <p className="text-muted-foreground">
            Manage your social media presence across all platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateAccount(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
          <Button onClick={() => setShowCreatePost(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalAccounts}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {Object.keys(statistics.accountsByPlatform).length} platforms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.postsByStatus.published || 0} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalMentions}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {Object.keys(statistics.mentionsByPlatform).length} platforms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.averageEngagementRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all posts
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>
                  Posts with highest engagement rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.topPerformingPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getPlatformColor(post.platform)} text-white`}>
                            {post.platform}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {post.type}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{post.content}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {post.engagement?.engagementRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {post.engagement?.likes} likes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>
                  Posts by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics && Object.entries(statistics.postsByPlatform).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform)}`} />
                        <span className="capitalize">{platform}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${getPlatformColor(account.platform)} flex items-center justify-center text-white font-bold`}>
                          {account.platform.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{account.displayName}</CardTitle>
                        <CardDescription>@{account.username}</CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getPlatformColor(account.platform)} text-white`}>
                      {account.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(account.followersCount)}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(account.followingCount)}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(account.postsCount)}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                  </div>
                  {account.bio && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {account.bio}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getPlatformColor(post.platform)} text-white`}>
                        {post.platform}
                      </Badge>
                      <Badge className={`${getStatusColor(post.status)} text-white`}>
                        {post.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {post.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {post.status === 'draft' && (
                        <Button size="sm" onClick={() => handlePublishPost(post.id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{post.content}</p>
                  
                  {post.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {post.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary">
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {post.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.mentions.map((mention, index) => (
                        <Badge key={index} variant="outline">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {post.engagement && (
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.engagement.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.engagement.comments}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {post.engagement.shares}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.engagement.views}
                      </div>
                    </div>
                  )}

                  {post.scheduledAt && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Schedule className="w-4 h-4" />
                      Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mentions" className="space-y-6">
          <div className="space-y-4">
            {mentions.map((mention) => (
              <Card key={mention.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getPlatformColor(mention.platform)} text-white`}>
                        {mention.platform}
                      </Badge>
                      <Badge variant={mention.priority === 'high' || mention.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {mention.priority}
                      </Badge>
                      <Badge variant="outline">
                        {mention.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {!mention.isResponded && (
                        <Button size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {mention.authorDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{mention.authorDisplayName}</span>
                        <span className="text-sm text-muted-foreground">
                          @{mention.authorUsername}
                        </span>
                      </div>
                      <p className="text-sm">{mention.content}</p>
                    </div>
                  </div>

                  {mention.sentiment && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Positive: {mention.sentiment.positive.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Negative: {mention.sentiment.negative.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        Neutral: {mention.sentiment.neutral.toFixed(1)}%
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Clock className="w-4 h-4" />
                    {new Date(mention.publishedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <CardDescription>{campaign.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {campaign.platforms.map((platform) => (
                        <Badge key={platform} className={`${getPlatformColor(platform)} text-white`}>
                          {platform}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div>Start: {new Date(campaign.startDate).toLocaleDateString()}</div>
                      {campaign.endDate && (
                        <div>End: {new Date(campaign.endDate).toLocaleDateString()}</div>
                      )}
                    </div>

                    {campaign.metrics && (
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{formatNumber(campaign.metrics.reach)}</div>
                          <div className="text-xs text-muted-foreground">Reach</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatNumber(campaign.metrics.engagement)}</div>
                          <div className="text-xs text-muted-foreground">Engagement</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatNumber(campaign.metrics.clicks)}</div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatNumber(campaign.metrics.conversions)}</div>
                          <div className="text-xs text-muted-foreground">Conversions</div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Social Account</CardTitle>
              <CardDescription>
                Connect a new social media account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newAccount.platform} onValueChange={(value) => setNewAccount({...newAccount, platform: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={newAccount.displayName}
                  onChange={(e) => setNewAccount({...newAccount, displayName: e.target.value})}
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <Label htmlFor="profileUrl">Profile URL</Label>
                <Input
                  id="profileUrl"
                  value={newAccount.profileUrl}
                  onChange={(e) => setNewAccount({...newAccount, profileUrl: e.target.value})}
                  placeholder="Enter profile URL"
                />
              </div>

              <div>
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="avatarUrl"
                  value={newAccount.avatarUrl}
                  onChange={(e) => setNewAccount({...newAccount, avatarUrl: e.target.value})}
                  placeholder="Enter avatar URL"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={newAccount.bio}
                  onChange={(e) => setNewAccount({...newAccount, bio: e.target.value})}
                  placeholder="Enter bio"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateAccount} className="flex-1">
                  Add Account
                </Button>
                <Button variant="outline" onClick={() => setShowCreateAccount(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create Social Post</CardTitle>
              <CardDescription>
                Create a new social media post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account">Account</Label>
                  <Select value={newPost.accountId} onValueChange={(value) => setNewPost({...newPost, accountId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.displayName} ({account.platform})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Post Type</Label>
                  <Select value={newPost.type} onValueChange={(value) => setNewPost({...newPost, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="What's on your mind?"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newPost.scheduledAt}
                  onChange={(e) => setNewPost({...newPost, scheduledAt: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreatePost} className="flex-1">
                  Create Post
                </Button>
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
