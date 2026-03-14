import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../db/prisma';
import { generateToken } from '../middleware/auth';

export const authRouter = Router();

// 카카오 로그인 URL 생성
authRouter.get('/kakao', (_req: Request, res: Response) => {
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  res.json({ url: kakaoAuthUrl });
});

// 카카오 콜백 — 인가 코드 → 토큰 → 유저 정보 → JWT 발급
authRouter.get('/kakao/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: '인가 코드가 없습니다' });
    return;
  }

  try {
    // 1. 인가 코드 → 카카오 액세스 토큰
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token } = tokenResponse.data;

    // 2. 액세스 토큰 → 카카오 유저 정보
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const kakaoUser = userResponse.data;
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname || '속기사';
    const avatar = kakaoUser.kakao_account?.profile?.profile_image_url || null;
    const email = kakaoUser.kakao_account?.email || null;

    // 3. DB에 유저 생성 또는 조회
    const user = await prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: 'kakao',
          providerId: kakaoId,
        },
      },
      update: {
        name: nickname,
        avatar,
        email,
      },
      create: {
        provider: 'kakao',
        providerId: kakaoId,
        name: nickname,
        avatar,
        email,
      },
    });

    // 4. JWT 발급
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 5. Electron 앱으로 커스텀 프로토콜을 통해 토큰 전달
    const deepLink = `caption-studio://auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.avatar || '')}`;
    res.send(`
      <html>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#eee;">
          <div style="text-align:center">
            <h2>로그인 성공!</h2>
            <p>Realtime Caption Studio로 돌아가세요.</p>
            <p style="color:#888;font-size:12px;">자동으로 앱이 열리지 않으면 <a href="${deepLink}" style="color:#4dabf7;">여기를 클릭</a>하세요.</p>
          </div>
          <script>window.location.href = "${deepLink}";</script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('[Auth] 카카오 로그인 실패:');
    console.error('[Auth] Status:', error.response?.status);
    console.error('[Auth] Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('[Auth] Message:', error.message);
    if (error.stack) console.error('[Auth] Stack:', error.stack);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
  }
});

// 게스트 로그인 — 닉네임만으로 접속
authRouter.post('/guest', async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다' });
    return;
  }

  try {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const user = await prisma.user.create({
      data: {
        provider: 'guest',
        providerId: guestId,
        name: name.trim(),
      },
    });

    const token = generateToken({
      userId: user.id,
      email: null,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    console.error('[Auth] 게스트 로그인 실패:', error.message);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
  }
});

// 토큰 검증
authRouter.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증이 필요합니다' });
    return;
  }

  try {
    const { verifyToken } = await import('../middleware/auth');
    const payload = verifyToken(header.split(' ')[1]);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, avatar: true, provider: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
      return;
    }

    res.json(user);
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
});
