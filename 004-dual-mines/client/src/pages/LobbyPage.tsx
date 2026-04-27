import React, { useState, useEffect } from 'react';
import { Moon, Sun, Gamepad2, Users, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/useTheme';
import socketService from '@/services/socket';
import type { GameMode, GameRoom, Player } from '@/types';

interface LobbyPageProps {
  onJoinRoom: (roomId: string, nickname: string, player: Player, roomState: GameRoom) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom }) => {
  const { theme, toggleTheme } = useTheme();
  const [nickname, setNickname] = useState(() => localStorage.getItem('minesweeper_nickname') || '');
  const [roomId, setRoomId] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('coop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    if (nickname) {
      localStorage.setItem('minesweeper_nickname', nickname);
    }
  }, [nickname]);

  useEffect(() => {
    const connect = async () => {
      try {
        await socketService.connect();
      } catch (err) {
        console.error('Failed to connect to server:', err);
        setError('无法连接到服务器，请稍后重试');
      }
    };
    connect();

    return () => {
      
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await socketService.createRoom(nickname.trim(), selectedMode);
      if (response.success && response.roomId && response.player && response.roomState) {
        localStorage.setItem('minesweeper_nickname', nickname.trim());
        onJoinRoom(response.roomId, nickname.trim(), response.player, response.roomState);
      } else {
        setError(response.error || '创建房间失败');
      }
    } catch (err) {
      setError('创建房间时发生错误');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间号');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await socketService.joinRoom(nickname.trim(), roomId.trim(), 'player');
      if (response.success && response.player && response.roomState) {
        localStorage.setItem('minesweeper_nickname', nickname.trim());
        onJoinRoom(roomId.trim(), nickname.trim(), response.player, response.roomState);
        setShowJoinDialog(false);
      } else {
        setError(response.error || '加入房间失败');
      }
    } catch (err) {
      setError('加入房间时发生错误');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAsSpectator = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间号');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await socketService.joinRoom(nickname.trim(), roomId.trim(), 'spectator');
      if (response.success && response.player && response.roomState) {
        localStorage.setItem('minesweeper_nickname', nickname.trim());
        onJoinRoom(roomId.trim(), nickname.trim(), response.player, response.roomState);
        setShowJoinDialog(false);
      } else {
        setError(response.error || '加入房间失败');
      }
    } catch (err) {
      setError('加入房间时发生错误');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">双人扫雷</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">欢迎</CardTitle>
              <CardDescription>
                输入你的昵称开始游戏
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input
                  id="nickname"
                  placeholder="输入你的昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">创建房间</CardTitle>
              <CardDescription>
                创建一个新房间等待其他玩家加入
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>游戏模式</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedMode === 'coop'}
                      onCheckedChange={() => setSelectedMode('coop')}
                    />
                    <Label className="flex items-center gap-1 cursor-pointer">
                      <Users className="w-4 h-4" />
                      协作模式
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedMode === 'battle'}
                      onCheckedChange={() => setSelectedMode('battle')}
                    />
                    <Label className="flex items-center gap-1 cursor-pointer">
                      <Flag className="w-4 h-4" />
                      对战模式
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedMode === 'coop' 
                    ? '协作模式：共用一个棋盘，轮流点击，谁踩雷都输' 
                    : '对战模式：各点各的棋盘，雷阵相同，谁先安全翻完谁赢'}
                </p>
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={isLoading || !nickname.trim()}
                className="w-full"
              >
                {isLoading ? '创建中...' : '创建房间'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">加入房间</CardTitle>
              <CardDescription>
                输入房间号加入已有的房间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowJoinDialog(true)}
                disabled={!nickname.trim()}
                className="w-full"
                variant="outline"
              >
                加入房间
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">操作说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>🖱️ <strong>鼠标操作：</strong>左键点击揭开格子，右键标记地雷</p>
              <p>👆 <strong>触摸操作：</strong>短按点击揭开格子，长按标记地雷</p>
              <p>⌨️ <strong>键盘操作：</strong>方向键移动，空格键点击，F键标记</p>
              <p>⏱️ <strong>时间限制：</strong>每步限时30秒，超时直接输</p>
              <p>🔄 <strong>重置功能：</strong>游戏中可发起重置投票，双方同意后重置</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>加入房间</DialogTitle>
            <DialogDescription>
              输入房间号，选择以玩家或观众身份加入
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">房间号</Label>
              <Input
                id="roomId"
                placeholder="输入房间号"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleJoinRoom}
                disabled={isLoading || !roomId.trim()}
                className="flex-1"
              >
                {isLoading ? '加入中...' : '作为玩家加入'}
              </Button>
              <Button
                onClick={handleJoinAsSpectator}
                disabled={isLoading || !roomId.trim()}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? '加入中...' : '作为观众加入'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
