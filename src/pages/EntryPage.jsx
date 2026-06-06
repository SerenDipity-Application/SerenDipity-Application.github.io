import { useNavigate } from 'react-router-dom'
import './EntryPage.css'

export default function EntryPage() {
  const navigate = useNavigate()
  return (
    <div className="entry-page">
      <div className="entry-border-frame">
        <div className="entry-top-badge">
          <span className="crown">♛</span> INVITE ONLY · 邀请制
        </div>

        <div className="entry-crest">
          <div className="crest-circle">
            <span className="crest-letter">S</span>
          </div>
        </div>

        <h1 className="entry-brand serif">SerenDipity</h1>
        <p className="entry-sub serif">· The Oxbridge Circle ·</p>

        <div className="entry-divider" />

        <h2 className="entry-event serif">牛剑舞会</h2>
        <p className="entry-event-en serif">Oxbridge Mayball 2026</p>
        <p className="entry-date">2026 年 6 月 27 日</p>

        <div className="entry-skyline">
          <svg viewBox="0 0 300 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="50" width="8" height="30" fill="#C9A84C" opacity="0.3"/>
            <rect x="20" y="40" width="6" height="40" fill="#C9A84C" opacity="0.25"/>
            <rect x="28" y="45" width="10" height="35" fill="#C9A84C" opacity="0.3"/>
            <rect x="50" y="30" width="4" height="50" fill="#C9A84C" opacity="0.4"/>
            <rect x="56" y="20" width="16" height="60" fill="#C9A84C" opacity="0.35"/>
            <polygon points="64,20 72,8 80,20" fill="#C9A84C" opacity="0.4"/>
            <rect x="80" y="35" width="8" height="45" fill="#C9A84C" opacity="0.3"/>
            <rect x="90" y="42" width="12" height="38" fill="#C9A84C" opacity="0.25"/>
            <rect x="110" y="28" width="6" height="52" fill="#C9A84C" opacity="0.4"/>
            <polygon points="113,28 116,14 119,28" fill="#C9A84C" opacity="0.45"/>
            <rect x="120" y="38" width="14" height="42" fill="#C9A84C" opacity="0.3"/>
            <rect x="150" y="25" width="5" height="55" fill="#C9A84C" opacity="0.4"/>
            <polygon points="152.5,25 155,10 157.5,25" fill="#C9A84C" opacity="0.5"/>
            <rect x="160" y="40" width="10" height="40" fill="#C9A84C" opacity="0.25"/>
            <rect x="175" y="35" width="20" height="45" fill="#C9A84C" opacity="0.3"/>
            <polygon points="185,35 185,18 195,35" fill="#C9A84C" opacity="0.35"/>
            <rect x="200" y="45" width="8" height="35" fill="#C9A84C" opacity="0.25"/>
            <rect x="215" y="38" width="6" height="42" fill="#C9A84C" opacity="0.3"/>
            <rect x="230" y="30" width="4" height="50" fill="#C9A84C" opacity="0.4"/>
            <polygon points="232,30 234,16 236,30" fill="#C9A84C" opacity="0.45"/>
            <rect x="240" y="42" width="12" height="38" fill="#C9A84C" opacity="0.25"/>
            <rect x="260" y="48" width="8" height="32" fill="#C9A84C" opacity="0.3"/>
            <rect x="272" y="40" width="6" height="40" fill="#C9A84C" opacity="0.25"/>
            <rect x="282" y="52" width="10" height="28" fill="#C9A84C" opacity="0.2"/>
          </svg>
        </div>

        <div className="entry-footer-text">
          <p>这里是本场活动的专属圈子</p>
          <p>通过签到二维码进入，即可加入</p>
        </div>

        <button className="entry-btn serif" onClick={() => navigate('/intro')}>
          进入本场圈子 &rsaquo;
        </button>

        <p className="entry-wechat-note">— 仅限在微信 / 小程序内使用 —</p>
      </div>
    </div>
  )
}
