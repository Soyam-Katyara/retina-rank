import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { mockAttempts } from '@/data/mockData';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';
import { AttemptedQuizCard } from '@/components/AttemptedQuizCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { User, ClipboardList, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, updateAvatar } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
  });

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSave = () => {
    // In production, this would call an API
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  const tabs = [
    { id: 'info', label: 'User Info', icon: User },
    { id: 'quizzes', label: 'Quiz Details', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'info' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button variant="default" size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <ProfileImageUpload
                      currentImage={user?.avatarUrl}
                      fallbackInitial={user?.fullName?.charAt(0) || 'U'}
                      onImageChange={(url) => updateAvatar(url)}
                      isEditing={isEditing}
                    />
                    <div>
                      <h2 className="text-xl font-semibold">{user?.fullName}</h2>
                      <p className="text-muted-foreground">@{user?.username}</p>
                      {user?.isGoogleUser && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google Account
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      {isEditing ? (
                        <Input
                          value={editData.fullName}
                          onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                      ) : (
                        <p className="p-3 bg-muted rounded-lg">{user?.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Username</Label>
                      {isEditing ? (
                        <Input
                          value={editData.username}
                          onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                        />
                      ) : (
                        <p className="p-3 bg-muted rounded-lg">@{user?.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <p className="p-3 bg-muted rounded-lg">{user?.email}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Created</Label>
                      <p className="p-3 bg-muted rounded-lg">
                        {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Quiz History</h2>
                  <Badge variant="secondary">{mockAttempts.length} attempts</Badge>
                </div>

                {mockAttempts.length > 0 ? (
                  <div className="grid gap-4">
                    {mockAttempts.map(attempt => (
                      <AttemptedQuizCard
                        key={attempt.id}
                        quizId={attempt.quizId}
                        quizTitle={attempt.quizTitle}
                        quizType={attempt.quizType}
                        quizImage={attempt.quizImage}
                        startedAt={attempt.startedAt}
                        completedAt={attempt.completedAt!}
                        onClick={() => navigate('/results/demo')}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No quiz attempts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Take your first quiz to see your results here
                      </p>
                      <Button onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
