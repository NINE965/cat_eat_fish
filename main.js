/* ============================================================
 *  main.js - 猫猫吃鱼大冒险 首页交互逻辑
 *  功能：弹窗管理、设置存储、排行榜、动态装饰、背景音乐
 *  预留扩展接口供后续游戏页面调用
 * ============================================================ */

'use strict';

/* ==================== 全局命名空间（扩展接口） ==================== */
// 将所有核心功能挂载到全局 CatGame 对象上，
// 方便后续开发的游戏页面、关卡选择页面等调用。
window.CatGame = window.CatGame || {};

/* ==================== DOM 元素缓存 ==================== */
// 集中获取所有需要操作的 DOM 元素，避免重复查询
const DOM = {
    // 按钮
    btnStart: document.getElementById('btnStart'),
    btnSettings: document.getElementById('btnSettings'),
    btnLeaderboard: document.getElementById('btnLeaderboard'),
    btnInstructions: document.getElementById('btnInstructions'),

    // 弹窗
    modalSettings: document.getElementById('modalSettings'),
    modalLeaderboard: document.getElementById('modalLeaderboard'),
    modalInstructions: document.getElementById('modalInstructions'),

    // 设置开关
    toggleMusic: document.getElementById('toggleMusic'),
    toggleSound: document.getElementById('toggleSound'),

    // 动态装饰层
    bubblesLayer: document.getElementById('bubblesLayer'),
    swimmingFishLayer: document.getElementById('swimmingFishLayer'),

    // 小猫
    mainCat: document.getElementById('mainCat'),

    // 页面容器
    pageHome: document.getElementById('pageHome'),
    pageDifficulty: document.getElementById('pageDifficulty'),
    pageGame: document.getElementById('pageGame'),

    // 难度选择页
    btnBackToHome: document.getElementById('btnBackToHome'),
    diffCards: document.querySelectorAll('.diff-card'),

    // 游戏场景
    gameArea: document.getElementById('gameArea'),
    gamePlayer: document.getElementById('gamePlayer'),
    hudLives: document.getElementById('hudLives'),
    hudScore: document.getElementById('hudScore'),
    hudDifficulty: document.getElementById('hudDifficulty'),
    btnPause: document.getElementById('btnPause'),
    btnExitGame: document.getElementById('btnExitGame'),

    // 游戏结束弹窗
    modalGameOver: document.getElementById('modalGameOver'),
    goTitle: document.getElementById('goTitle'),
    newRecordBadge: document.getElementById('newRecordBadge'),
    goScore: document.getElementById('goScore'),
    goHighScore: document.getElementById('goHighScore'),
    goDifficulty: document.getElementById('goDifficulty'),
    btnRestart: document.getElementById('btnRestart'),
    btnGoDifficulty: document.getElementById('btnGoDifficulty'),
    btnGoHome: document.getElementById('btnGoHome'),

    // 排行榜分难度展示
    lbEasy: document.getElementById('lbEasy'),
    lbNormal: document.getElementById('lbNormal'),
    lbHard: document.getElementById('lbHard'),
};

/* ==================== 本地存储管理 ==================== */

/**
 * 从 localStorage 读取数据
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析后的数据
 */
function loadFromStorage(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
        console.warn('读取本地存储失败:', key, e);
        return defaultValue;
    }
}

/**
 * 保存数据到 localStorage
 * @param {string} key - 存储键名
 * @param {*} value - 要存储的数据
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('保存本地存储失败:', key, e);
    }
}

// 【优化】存储键名常量（方便统一管理）
const STORAGE_KEYS = {
    SETTINGS: 'catGame_settings',
    // 分难度独立存储最高分
    LEADERBOARD_EASY: 'catGame_leaderboard_easy',
    LEADERBOARD_NORMAL: 'catGame_leaderboard_normal',
    LEADERBOARD_HARD: 'catGame_leaderboard_hard',
    // 【新增】限时挑战最高分
    LEADERBOARD_TIMED: 'catGame_leaderboard_timed',
    // 【新增】小猫皮肤
    SKIN: 'catGame_skin',
    // 【新增】累计总分（用于皮肤解锁）
    TOTAL_SCORE: 'catGame_totalScore',
    // 【新增】背景音乐选择与恶魔道具累计
    MUSIC_TRACK: 'catGame_musicTrack',
    TOTAL_EVIL_PROP_COUNT: 'catGame_totalEvilPropCount',
};

/* ==================== 本地素材路径配置 ==================== */
/**
 * 所有资源路径统一使用相对路径，禁止使用本地绝对路径（如 D:\\...）
 * 部署规范：将 audio/ images/ 与 index.html、style.css、main.js 放在同一项目根目录，打包时一并压缩交付。
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │              素材预处理规范（抠图标准）                    │
 * ├──────────────────────────────────────────────────────────┤
 * │ 1. 仅保留小猫/meme角色主体，删除背景/文字/水印/边框      │
 * │ 2. 透明背景 PNG/GIF，不残留白底/黑底/蓝底/灰底          │
 * │ 3. 1px硬边缘，关闭羽化、抗锯齿柔化                       │
 * │ 4. 主体居中，四周预留均匀空白像素                         │
 * │ 5. 不裁切耳朵/尾巴/爪子/胡须/表情部位                     │
 * │ 6. 毛发边缘做杂色去除处理                                │
 * │ 7. 保持原始比例，不拉伸变形                               │
 * │ 8. 若素材未预处理透明底，CSS层有兜底去边样式              │
 * │ 涉及素材（全覆盖校验）：                                 │
 * │   - 4款解锁皮肤：youya.png stand.png jiquan.png          │
 * │     rencomehere.png                                      │
 * │   - 连击中心表情包：cry.png dangji.png hit.png            │
 * │     wuzui.gif laodeng.gif maodie.gif zhizhu.gif           │
 * │     angry.png stupid.png hanliujiabei.png                 │
 * │   - 主页彩蛋表情包：同连击包 + jiquan.png rencomehere.png │
 * │     stand.png youya.png                                  │
 * └──────────────────────────────────────────────────────────┘
 */
const ASSET_PATHS = {
    audio: {
        bgm: 'audio/hajimi.mp3',
        comboMeow: 'audio/cat_meow.mp3',
        nanbei1: 'audio/nanbeilvdou1.mp3',
        nanbei2: 'audio/nanbeilvdou2.mp3',
    },
    images: {
        // 连击表情包素材（全部需按素材预处理规范抠图为透明底，见顶部 ASSET_PATHS 注释）
        // 注意：已删除 dangji.jpg / cry.jpg，仅保留抠图完成的 PNG 透明素材
        comboMemes: [
                'images/cry.png',
                'images/dangji.png',
                'images/hit.png',
                'images/wuzui.gif',
                'images/laodeng.gif',
                'images/maodie.gif',
                'images/zhizhu.gif',
                'images/angry.png',
                'images/stupid.png',
                'images/hanliujiabei.png',
            ],
        homeEasterEgg: [
            'images/jiquan.png',
            'images/laodeng.gif',
            'images/maodie.gif',
            'images/rencomehere.png',
            'images/stand.png',
            'images/stupid.png',
            'images/wuzui.gif',
            'images/youya.png',
            'images/zhizhu.gif',
            'images/angry.png',
            'images/cry.png',
            'images/dangji.png',
            'images/hanliujiabei.png',
            'images/hit.png',
        ],
        skins: {
            default: '',  // 橘色猫默认使用纯CSS绘制，无外部图片
            youya: 'images/youya.png',
            jiquan: 'images/jiquan.png',
            rencomehere: 'images/rencomehere.png',
            stand: 'images/stand.png',
        },
    },
};

/**
 * 背景音乐轨道配置
 * 数量固定为三首，默认原版哈基米直接解锁
 * 搞怪曲 1、2 需要通过恶魔道具累计拾取解锁
 */
const MUSIC_TRACKS = {
    hajimi: {
        id: 'hajimi',
        name: '原版哈基米',
        src: ASSET_PATHS.audio.bgm,
        requiredEvilCount: 0,
        description: '默认原版背景音乐，可立即切换。',
    },
    nanbeilvdou1: {
        id: 'nanbeilvdou1',
        name: '搞怪曲 1',
        src: ASSET_PATHS.audio.nanbei1,
        requiredEvilCount: 100,
        description: '累计拾取恶魔道具100次后解锁。',
    },
    nanbeilvdou2: {
        id: 'nanbeilvdou2',
        name: '搞怪曲 2',
        src: ASSET_PATHS.audio.nanbei2,
        requiredEvilCount: 200,
        description: '累计拾取恶魔道具200次后解锁。',
    },
};

/**
 * 恶魔道具概率控制
 * 与现有道具共用同一套掉落生成逻辑，不占用原有道具掉落预设。
 */
const EVIL_PROP_SPAWN_CHANCE = 0.12; // 10%-15%区间的稳定值
const EVIL_PROP_CONFIG = {
    id: 'evilDemon',
    emoji: '😈',
    name: '恶魔道具',
    desc: '受到诅咒，移动速度降低并清空当前连击。',
    duration: 5000,
    effectType: 'debuff',
    playerSpeedMultiplier: 0.5,
    // 提示文字：吃到恶魔道具时显示（已按需求替换）
    broadcastText: '邪恶哈基米值+1',
};

/* ==================== 本地文件存档（skin_data.json）支持 ==================== */
/**
 * 加载本地存档文件 skin_data.json（通过 HTTP GET），并做格式兼容与容错处理
 * 返回解析后的标准对象或 null（表示加载失败或不存在）
 * 标准对象格式：{ totalScore: number, skins: { <id>: { unlocked: boolean } }, leaderboard?: {...} }
 */
function loadSkinSave() {
    return fetch('/skin_data.json', { cache: 'no-store' })
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (raw) {
                // 兼容旧格式（skin_save.json）与新格式（skin_data.json）
            try {
                if (!raw) return null;
                var out = { totalScore: 0, skins: {}, leaderboard: null };

                // totalScore 兼容
                if (typeof raw.totalScore === 'number') out.totalScore = raw.totalScore;
                else if (typeof raw.total_score === 'number') out.totalScore = raw.total_score;

                // skins / unlocked 兼容
                if (raw.unlocked && typeof raw.unlocked === 'object') {
                    Object.keys(raw.unlocked).forEach(function (k) {
                        out.skins[k] = { unlocked: !!raw.unlocked[k] };
                    });
                } else if (raw.skins && typeof raw.skins === 'object') {
                    // 原来可能为 { skins: { id: { unlocked: true } } }
                    Object.keys(raw.skins).forEach(function (k) {
                        var v = raw.skins[k];
                        if (typeof v === 'object') {
                            out.skins[k] = { unlocked: !!v.unlocked };
                        } else {
                            out.skins[k] = { unlocked: !!v };
                        }
                    });
                } else if (raw.skins && Array.isArray(raw.skins)) {
                    // 防护：若为数组则跳过
                }

                // leaderboard / highScores 兼容
                if (raw.highScores && typeof raw.highScores === 'object') out.leaderboard = raw.highScores;
                else if (raw.leaderboard && typeof raw.leaderboard === 'object') out.leaderboard = raw.leaderboard;

                return out;
            } catch (e) {
                console.warn('解析 skin_data.json 内容异常，返回 null：', e);
                return null;
            }
        })
        .catch(function (e) {
            console.warn('读取 skin_data.json 失败，使用默认值：', e);
            return null;
        });
}

/**
 * 将皮肤/排行榜等存档写回到项目根目录的 skin_data.json
 * 使用 POST /save_skin，服务器会将内容写入磁盘。
 * 支持把传入对象按新格式转换并保存。返回 Promise，成功则 resolve(true)，失败 resolve(false)
 */
function saveSkinSave(obj) {
    try {
        var payload = { totalScore: 0, unlocked: {}, highScores: null };
        if (obj && typeof obj === 'object') {
            // 如果传入格式为 { skins: { id: { unlocked: true } }, totalScore, leaderboard }
            if (typeof obj.totalScore === 'number') payload.totalScore = obj.totalScore;
            else if (typeof obj.total_score === 'number') payload.totalScore = obj.total_score;

            if (obj.skins && typeof obj.skins === 'object') {
                Object.keys(obj.skins).forEach(function (k) {
                    var v = obj.skins[k];
                    if (typeof v === 'object') payload.unlocked[k] = !!v.unlocked;
                    else payload.unlocked[k] = !!v;
                });
            } else if (obj.unlocked && typeof obj.unlocked === 'object') {
                payload.unlocked = obj.unlocked;
            }

            if (obj.leaderboard) payload.highScores = obj.leaderboard;
            else if (obj.leaderboard && typeof obj.leaderboard === 'object') payload.highScores = obj.leaderboard;
            else if (obj.highScores) payload.highScores = obj.highScores;
        }

        return fetch('/save_skin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(function (r) { return r.ok; }).catch(function (e) {
            console.warn('保存 skin_data.json 失败：', e);
            return false;
        });
    } catch (e) {
        console.warn('保存 skin_data.json 失败：', e);
        return Promise.resolve(false);
    }
}

/* ==================== 设置管理 ==================== */

/**
 * 游戏设置管理对象
 * 负责读取、保存、切换各项设置
 */
const Settings = {
    // 当前设置状态
    data: {
        musicEnabled: true,   // 背景音乐开关
        soundEnabled: true,   // 游戏音效开关
    },

    /**
     * 初始化：从 localStorage 加载设置
     */
    init: function () {
        const saved = loadFromStorage(STORAGE_KEYS.SETTINGS, null);
        if (saved) {
            this.data.musicEnabled = saved.musicEnabled !== false;
            this.data.soundEnabled = saved.soundEnabled !== false;
        }
        // 同步 UI 开关状态
        this.syncUI();
    },

    /**
     * 同步设置数据到 UI 开关
     */
    syncUI: function () {
        DOM.toggleMusic.checked = this.data.musicEnabled;
        DOM.toggleSound.checked = this.data.soundEnabled;
    },

    /**
     * 切换背景音乐
     * @returns {boolean} 切换后的状态
     */
    toggleMusic: function () {
        this.data.musicEnabled = !this.data.musicEnabled;
        this.save();
        this.syncUI();
        // 根据开关状态控制背景音乐
        if (this.data.musicEnabled) {
            BGMPlayer.start();
        } else {
            BGMPlayer.stop();
        }
        // 播放点击音效
        SoundPlayer.playClick();
        return this.data.musicEnabled;
    },

    /**
     * 切换游戏音效
     * @returns {boolean} 切换后的状态
     */
    toggleSound: function () {
        this.data.soundEnabled = !this.data.soundEnabled;
        this.save();
        this.syncUI();
        SoundPlayer.playClick();
        return this.data.soundEnabled;
    },

    /**
     * 保存设置到 localStorage
     */
    save: function () {
        saveToStorage(STORAGE_KEYS.SETTINGS, this.data);
    },

    /**
     * 获取当前设置（供外部调用）
     * @returns {Object} 当前设置对象
     */
    getSettings: function () {
        return { ...this.data };
    },
};

/* ==================== 背景音乐选择与恶魔道具统计管理 ==================== */
const MusicManager = {
    currentTrack: 'hajimi',
    evilCount: 0,

    init: function () {
        this.evilCount = loadFromStorage(STORAGE_KEYS.TOTAL_EVIL_PROP_COUNT, 0) || 0;
        this.currentTrack = loadFromStorage(STORAGE_KEYS.MUSIC_TRACK, 'hajimi');
        if (!MUSIC_TRACKS[this.currentTrack]) {
            this.currentTrack = 'hajimi';
        }
        this.saveCurrentTrack();
        this.updateTrackPanel();
    },

    saveCurrentTrack: function () {
        saveToStorage(STORAGE_KEYS.MUSIC_TRACK, this.currentTrack);
    },

    saveEvilCount: function () {
        saveToStorage(STORAGE_KEYS.TOTAL_EVIL_PROP_COUNT, this.evilCount);
    },

    isUnlocked: function (trackId) {
        var track = MUSIC_TRACKS[trackId];
        if (!track) return false;
        return this.evilCount >= (track.requiredEvilCount || 0);
    },

    selectTrack: function (trackId) {
        if (!MUSIC_TRACKS[trackId]) return false;
        if (!this.isUnlocked(trackId)) return false;
        if (this.currentTrack === trackId) return true;
        this.currentTrack = trackId;
        this.saveCurrentTrack();
        this.updateTrackPanel();
        BGMPlayer.setTrack(trackId);
        if (Settings.data.musicEnabled) {
            BGMPlayer.start();
        }
        return true;
    },

    addEvilCount: function (amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            amount = 1;
        }
        this.evilCount = Math.max(0, this.evilCount + amount);
        this.saveEvilCount();
        this.updateTrackPanel();
        return this.evilCount;
    },

    updateTrackPanel: function () {
        var self = this;
        Object.keys(MUSIC_TRACKS).forEach(function (trackId) {
            var track = MUSIC_TRACKS[trackId];
            var card = document.querySelector('.music-track-card[data-track="' + trackId + '"]');
            if (!card) return;
            var isUnlocked = self.isUnlocked(trackId);
            var isSelected = self.currentTrack === trackId;
            card.className = 'music-track-card music-track-' + trackId + (isUnlocked ? ' unlocked' : ' locked') + (isSelected ? ' selected' : '');

            var statusEl = card.querySelector('.music-track-status');
            if (statusEl) {
                if (isUnlocked) {
                    statusEl.textContent = '✅ 已解锁';
                    statusEl.classList.remove('locked-text');
                    statusEl.classList.add('unlocked-text');
                    card.style.pointerEvents = 'auto';
                    card.setAttribute('aria-disabled', 'false');
                } else {
                    statusEl.textContent = '🔒 累计拾取恶魔道具' + track.requiredEvilCount + '个解锁';
                    statusEl.classList.remove('unlocked-text');
                    statusEl.classList.add('locked-text');
                    card.style.pointerEvents = 'none';
                    card.setAttribute('aria-disabled', 'true');
                }
            }
        });
    },
};

/* ==================== 恶魔道具累计计数（UI展示专用） ==================== */
const EvilCountTracker = {
    _count: 0,

    init: function () {
        this._count = loadFromStorage(STORAGE_KEYS.TOTAL_EVIL_PROP_COUNT, 0);
        this.updateUI();
    },

    increment: function (n) {
        if (typeof n !== 'number' || n <= 0) n = 1;
        this._count = Math.max(0, this._count + n);
        this.updateUI();
        return this._count;
    },

    reset: function () {
        this._count = 0;
        this.updateUI();
    },

    updateUI: function () {
        var count = this._count;
        var hudEl = document.getElementById('hudEvilCount');
        if (hudEl) {
            hudEl.textContent = '邪恶哈基米：' + count;
            hudEl.classList.remove('evil-pop');
            void hudEl.offsetWidth;
            hudEl.classList.add('evil-pop');
        }
        var homeEl = document.getElementById('homeEvilCountText');
        if (homeEl) {
            homeEl.textContent = '👿 邪恶哈基米累计值：' + count;
        }
        var setEl = document.getElementById('settingEvilCountText');
        if (setEl) {
            setEl.textContent = '当前累计恶魔道具：' + count + ' 个';
        }
    },
};


/* ==================== 排行榜管理（分难度独立最高分） */
/**
 * 【优化】排行榜管理对象
 * 分别保存简单、一般、困难三个难度的独立最高分
 * 使用 localStorage 持久化，刷新不丢失
 */
const Leaderboard = {
    /** 所有模式最高分数据 */
    scores: {
        easy: 0,
        normal: 0,
        hard: 0,
        timed: 0,  // 【新增】限时挑战最高分
    },

    /**
     * 初始化：从 localStorage 加载所有模式最高分
     */
    init: function () {
        this.scores.easy = loadFromStorage(STORAGE_KEYS.LEADERBOARD_EASY, 0);
        this.scores.normal = loadFromStorage(STORAGE_KEYS.LEADERBOARD_NORMAL, 0);
        this.scores.hard = loadFromStorage(STORAGE_KEYS.LEADERBOARD_HARD, 0);
        this.scores.timed = loadFromStorage(STORAGE_KEYS.LEADERBOARD_TIMED, 0); // 【新增】
    },

    /**
     * 保存指定难度的分数（仅在超过历史最高分时保存）
     * @param {string} difficulty - 'easy' | 'normal' | 'hard' | 'timed'
     * @param {number} score - 本次得分
     * @returns {boolean} 是否打破最高分记录
     */
    saveScore: function (difficulty, score) {
        if (typeof score !== 'number' || score < 0) return false;
        score = Math.floor(score);

        var isNewRecord = false;
        if (score > (this.scores[difficulty] || 0)) {
            this.scores[difficulty] = score;
            isNewRecord = true;
            var keyMap = {
                easy: STORAGE_KEYS.LEADERBOARD_EASY,
                normal: STORAGE_KEYS.LEADERBOARD_NORMAL,
                hard: STORAGE_KEYS.LEADERBOARD_HARD,
                timed: STORAGE_KEYS.LEADERBOARD_TIMED, // 【新增】
            };
            saveToStorage(keyMap[difficulty], score);
        }
        return isNewRecord;
    },

    /**
     * 获取指定难度历史最高分
     * @param {string} difficulty
     * @returns {number}
     */
    getHighScore: function (difficulty) {
        return this.scores[difficulty] || 0;
    },

    /** 获取所有模式最高分 */
    getAllScores: function () {
        return {
            easy: this.scores.easy,
            normal: this.scores.normal,
            hard: this.scores.hard,
            timed: this.scores.timed, // 【新增】
        };
    },

    /** 清空所有数据 */
    clearAll: function () {
        this.scores.easy = 0; this.scores.normal = 0; this.scores.hard = 0; this.scores.timed = 0;
        saveToStorage(STORAGE_KEYS.LEADERBOARD_EASY, 0);
        saveToStorage(STORAGE_KEYS.LEADERBOARD_NORMAL, 0);
        saveToStorage(STORAGE_KEYS.LEADERBOARD_HARD, 0);
        saveToStorage(STORAGE_KEYS.LEADERBOARD_TIMED, 0); // 【新增】
    },

    /** 渲染排行榜弹窗（含限时模式） */
    render: function () {
        var allScores = this.getAllScores();
        // 简单
        var el = document.getElementById('lbEasy');
        if (el) { var s = el.querySelector('.lb-diff-score'); if (s) s.textContent = allScores.easy > 0 ? allScores.easy + ' 分' : '-'; }
        // 一般
        el = document.getElementById('lbNormal');
        if (el) { var s = el.querySelector('.lb-diff-score'); if (s) s.textContent = allScores.normal > 0 ? allScores.normal + ' 分' : '-'; }
        // 困难
        el = document.getElementById('lbHard');
        if (el) { var s = el.querySelector('.lb-diff-score'); if (s) s.textContent = allScores.hard > 0 ? allScores.hard + ' 分' : '-'; }
        // 【新增】限时挑战
        el = document.getElementById('lbTimed');
        if (el) { var s = el.querySelector('.lb-diff-score'); if (s) s.textContent = allScores.timed > 0 ? allScores.timed + ' 分' : '-'; }
    },
};

/* ==================== 背景音乐播放器（HTMLAudioElement + Web Audio 音效） ==================== */

/**
 * 背景音乐播放器（基于 HTMLAudioElement）
 * 使用本地相对路径 audio/hajimi.mp3，禁止使用 D 盘绝对路径。
 * 部署规范：audio 文件夹需与 index.html、style.css、main.js 放在同一项目根目录，打包时一并压缩交付。
 */
const BGMPlayer = {
    /** @type {HTMLAudioElement|null} */
    audio: null,
    /** @type {AudioContext|null} */
    audioContext: null,
    /** @type {GainNode|null} */
    sfxGain: null,

    /** 是否正在播放 */
    isPlaying: false,

    /** 背景音乐主音量（0-1） */
    volume: 0.25,
    /** 保存暂停前的音量，用于恢复 */
    _savedVolume: 0.25,

    /** 初始化 HTMLAudioElement 与音效 AudioContext */
    init: function () {
        if (this.audio && this.audioContext) return;

        if (!this.audio) {
            try {
                var audio = document.createElement('audio');
                var selectedTrack = 'hajimi';
                if (MusicManager && MUSIC_TRACKS[MusicManager.currentTrack]) {
                    selectedTrack = MusicManager.currentTrack;
                }
                var src = (MUSIC_TRACKS[selectedTrack] || MUSIC_TRACKS.hajimi).src;
                audio.src = src;
                audio.loop = true;
                audio.preload = 'auto';
                audio.volume = this.volume;
                audio.setAttribute('playsinline', '');
                audio.addEventListener('error', function () {
                    console.warn('背景音乐加载失败，请检查 audio/ 目录下文件是否存在。');
                });
                this.audio = audio;
                this.currentTrack = selectedTrack;
            } catch (e) {
                console.warn('无法初始化背景音乐播放器：', e);
                this.audio = null;
            }
        }

        if (!this.audioContext) {
            try {
                var ctx = new (window.AudioContext || window.webkitAudioContext)();
                var gain = ctx.createGain();
                gain.gain.setValueAtTime(1.0, ctx.currentTime);
                gain.connect(ctx.destination);
                this.audioContext = ctx;
                this.sfxGain = gain;
            } catch (e) {
                console.warn('无法初始化音效环境：', e);
                this.audioContext = null;
                this.sfxGain = null;
            }
        }
    },

    /** 开始播放背景音乐 */
    start: function () {
        if (!Settings.data.musicEnabled) return;
        if (!this.audio) this.init();
        if (!this.audio) return;

        this.audio.volume = this.volume;
        this._savedVolume = this.volume;
        var promise = this.audio.play();
        if (promise && promise.catch) {
            promise.catch(function (e) {
                console.warn('背景音乐播放被浏览器阻止：', e);
            });
        }
        this.isPlaying = true;
    },

    /** 停止播放背景音乐 */
    stop: function () {
        if (!this.audio) return;
        this.audio.pause();
        this.isPlaying = false;
    },

    /** 将背景音乐音量降低 (暂停、结算页等) */
    lowerVolume: function () {
        if (!this.audio) return;
        this._savedVolume = this.audio.volume;
        this.audio.volume = Math.max(0, this.volume * 0.3);
    },

    /** 恢复背景音乐音量 */
    restoreVolume: function () {
        if (!this.audio) return;
        this.audio.volume = this._savedVolume;
    },

    /** 设置当前音乐轨道 */
    setTrack: function (trackId) {
        if (!MUSIC_TRACKS[trackId]) return false;
        if (!this.audio) {
            this.init();
        }
        if (!this.audio) return false;
        var track = MUSIC_TRACKS[trackId];
        if (!track) return false;
        var wasPlaying = this.isPlaying;
        this.audio.pause();
        this.audio.src = track.src;
        this.currentTrack = trackId;
        if (wasPlaying && Settings.data.musicEnabled) {
            this.start();
        }
        return true;
    },

    /** 切换音乐开关 */
    toggle: function () {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    },
};

/* ==================== 音效播放器（Web Audio API） ==================== */

/**
 * 短促音效播放（按钮点击等）
 * 复用 BGMPlayer 的 HTMLAudioElement/AudioContext 逻辑，仅保持现有短音效行为。
 */
const SoundPlayer = {
    /**
     * 播放点击音效（短促的"啵"声）
     */
    playClick: function () {
        if (!Settings.data.soundEnabled) return;
        BGMPlayer.init();
        var ctx = BGMPlayer.audioContext;
        if (!ctx) {
            return;
        }
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        if (BGMPlayer.sfxGain) {
            gain.connect(BGMPlayer.sfxGain);
        } else {
            gain.connect(ctx.destination);
        }
        osc.start(now);
        osc.stop(now + 0.12);
    },
};

/* ==================== 弹窗管理 ==================== */

/**
 * 弹窗管理对象
 * 统一管理所有弹窗的打开、关闭
 */
const ModalManager = {
    /** 当前打开的弹窗 ID */
    currentModal: null,

    /**
     * 初始化：为所有弹窗绑定关闭事件
     */
    init: function () {
        var self = this;

        // 获取所有弹窗
        var allModals = document.querySelectorAll('.modal-overlay');

        allModals.forEach(function (overlay) {
            // 点击遮罩层关闭弹窗
            overlay.addEventListener('click', function (event) {
                // 只有点击遮罩本身（非弹窗内容）才关闭
                if (event.target === overlay) {
                    self.close(overlay.id);
                }
            });

            // 点击关闭按钮关闭弹窗
            var closeBtn = overlay.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    self.close(overlay.id);
                });
            }
        });

        // ESC 键关闭当前弹窗
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && self.currentModal) {
                self.close(self.currentModal);
            }
        });
    },

    /**
     * 打开指定弹窗
     * @param {string} modalId - 弹窗 DOM 元素的 id
     */
    open: function (modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        // 如果已有打开的弹窗，先关闭
        if (this.currentModal && this.currentModal !== modalId) {
            this.close(this.currentModal);
        }

        // 显示弹窗
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        this.currentModal = modalId;

        // 阻止背景页面滚动
        document.body.style.overflow = 'hidden';

        // 如果是排行榜弹窗，刷新数据
        if (modalId === 'modalLeaderboard') {
            Leaderboard.render();
        }

        // 如果是设置弹窗，强制从本地存档 reload 解锁状态并刷新 UI
        if (modalId === 'modalSettings') {
            var self = this;
            loadSkinSave().then(function (data) {
                if (!data) return;
                try {
                    // 更新 SkinManager 的强制解锁标记
                    Object.keys(SkinManager.skins).forEach(function (sid) {
                        if (data.skins && data.skins[sid] && typeof data.skins[sid].unlocked === 'boolean') {
                            SkinManager.skins[sid].__forceUnlocked = !!data.skins[sid].unlocked;
                        }
                    });
                    if (typeof data.totalScore === 'number') {
                        SkinManager.totalScore = data.totalScore;
                        saveToStorage(STORAGE_KEYS.TOTAL_SCORE, SkinManager.totalScore);
                    }
                    SkinManager.updateSkinPanel();
                } catch (e) {
                    console.warn('加载 skin_data.json 到设置面板时发生错误：', e);
                }
            }).catch(function () {
                // ignore
            });
            MusicManager.updateTrackPanel();
        }
    },

    /**
     * 关闭指定弹窗
     * @param {string} modalId - 弹窗 DOM 元素的 id
     */
    close: function (modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');

        if (this.currentModal === modalId) {
            this.currentModal = null;
        }

        // 关闭游戏结束弹窗时恢复 BGM 并停止烟花
        if (modalId === 'modalGameOver') {
            BGMPlayer.restoreVolume();
            FireworkSystem.stop(); // 【新增】
        }

        // 恢复背景页面滚动
        document.body.style.overflow = '';
    },

    /**
     * 关闭当前打开的弹窗
     */
    closeCurrent: function () {
        if (this.currentModal) {
            this.close(this.currentModal);
        }
    },
};

/* ==================== 首页彩蛋表情包生命周期管理 ==================== */
/**
 * HomeEasterEggManager — 管理首页彩蛋图片的创建、倒计时与按钮触发清除
 * 点击任意首页交互按钮时立即清除所有彩蛋，终止定时器避免残留
 */
const HomeEasterEggManager = {
    /** 当前存活的彩蛋列表 { el, timerFadeOut, timerRemove, timerShow } */
    _eggs: [],

    /** 新增一个彩蛋并跟踪其上屏/渐隐/移除定时器 */
    register: function (eggData) {
        this._eggs.push(eggData);
    },

    /** 立刻清除所有首页彩蛋：终止定时器 + 移除DOM */
    clearAll: function () {
        var list = this._eggs;
        while (list.length > 0) {
            var item = list.pop();
            if (item.timerShow)     clearTimeout(item.timerShow);
            if (item.timerFadeOut)  clearTimeout(item.timerFadeOut);
            if (item.timerRemove)   clearTimeout(item.timerRemove);
            if (item.el && item.el.parentNode) {
                item.el.parentNode.removeChild(item.el);
            }
        }
    },
};


/* ==================== 动态气泡生成 ==================== */

/**
 * 动态气泡管理
 * 定时在页面底部生成气泡，气泡缓慢上浮消失
 */
const BubbleGenerator = {
    /** 生成间隔计时器 */
    intervalId: null,

    /** 最小生成间隔（毫秒） */
    MIN_INTERVAL: 400,

    /** 最大生成间隔（毫秒） */
    MAX_INTERVAL: 1000,

    /**
     * 开始生成气泡
     */
    start: function () {
        var self = this;
        this.stop(); // 先停止已有的

        /**
         * 生成单个气泡
         */
        function createBubble() {
            var bubble = document.createElement('div');
            bubble.className = 'bubble';

            // 随机气泡大小（20px ~ 45px）
            var size = 20 + Math.random() * 25;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';

            // 随机水平位置
            bubble.style.left = Math.random() * 90 + '%';

            // 随机动画时长（4s ~ 9s）
            var duration = 4 + Math.random() * 5;
            bubble.style.animationDuration = duration + 's';

            // 随机初始延迟
            bubble.style.animationDelay = Math.random() * 0.5 + 's';

            // 添加到气泡层
            DOM.bubblesLayer.appendChild(bubble);

            // 动画结束后自动移除气泡（避免 DOM 堆积）
            var removeTime = (duration + 0.5) * 1000;
            setTimeout(function () {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, removeTime);
        }

        /**
         * 按随机间隔持续生成气泡
         */
        function scheduleNext() {
            // 立即生成一个
            createBubble();

            // 随机间隔后生成下一个
            var nextInterval = self.MIN_INTERVAL + Math.random() * (self.MAX_INTERVAL - self.MIN_INTERVAL);
            self.intervalId = setTimeout(scheduleNext, nextInterval);
        }

        scheduleNext();
    },

    /**
     * 停止生成气泡
     */
    stop: function () {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        // 清空已有气泡
        DOM.bubblesLayer.innerHTML = '';
    },
};

/* ==================== 动态游动小鱼生成 ==================== */

/**
 * 动态游动小鱼管理
 * 定时在页面边缘生成小鱼，小鱼来回游动
 */
const FishGenerator = {
    /** 游动小鱼数组（用于追踪和管理） */
    fishes: [],

    /** 最大同时游动的小鱼数量 */
    MAX_FISH: 4,

    /**
     * 开始生成游动小鱼
     */
    start: function () {
        var self = this;

        // 初始生成几条小鱼
        for (var i = 0; i < this.MAX_FISH; i++) {
            this.createFish();
        }

        // 定时补充（当某条鱼游出屏幕后被移除，补充新的）
        this.replenishInterval = setInterval(function () {
            // 清理已移除的鱼引用
            self.fishes = self.fishes.filter(function (f) {
                return f.parentNode;
            });
            // 如果不够最大数量，补充
            if (self.fishes.length < self.MAX_FISH) {
                self.createFish();
            }
        }, 4000);
    },

    /**
     * 创建一条游动小鱼
     */
    createFish: function () {
        var fish = document.createElement('span');
        fish.className = 'swimming-fish';

        // 随机选择小鱼种类
        var fishTypes = ['🐟', '🐠', '🐡', '🐟', '🐠'];
        fish.textContent = fishTypes[Math.floor(Math.random() * fishTypes.length)];

        // 随机选择游动方向
        var goRight = Math.random() > 0.5;
        fish.classList.add(goRight ? 'direction-right' : 'direction-left');

        // 随机垂直位置（避开标题和按钮区域，让鱼在中间和背景游动）
        fish.style.top = (15 + Math.random() * 55) + '%';

        // 随机大小
        var size = 1.2 + Math.random() * 1.3;
        fish.style.fontSize = size + 'rem';

        // 随机游动速度（动画时长）
        var duration = 8 + Math.random() * 12;
        fish.style.animationDuration = duration + 's';

        // 随机初始延迟
        fish.style.animationDelay = Math.random() * 3 + 's';

        // 添加到页面
        DOM.swimmingFishLayer.appendChild(fish);
        this.fishes.push(fish);

        // 动画结束后移除小鱼
        var self = this;
        var removeTime = (duration + 3) * 1000;
        setTimeout(function () {
            if (fish.parentNode) {
                fish.parentNode.removeChild(fish);
            }
            // 从追踪数组中移除
            var idx = self.fishes.indexOf(fish);
            if (idx > -1) {
                self.fishes.splice(idx, 1);
            }
        }, removeTime);
    },

    /**
     * 停止游动小鱼
     */
    stop: function () {
        if (this.replenishInterval) {
            clearInterval(this.replenishInterval);
            this.replenishInterval = null;
        }
        // 清除所有鱼
        DOM.swimmingFishLayer.innerHTML = '';
        this.fishes = [];
    },
};

/* ==================== 事件绑定 ==================== */

/**
 * 初始化所有按钮的点击事件
 */
function bindEvents() {
    // 开始游戏按钮 → 跳转到难度选择页（带防抖）
    DOM.btnStart.addEventListener('click', function () {
        // 【优化】防止快速重复点击
        if (GameEngine.isRunning || GameEngine.isInitializing) {
            return;
        }
        HomeEasterEggManager.clearAll();
        SoundPlayer.playClick();
        PageManager.goDifficulty();
    });

    // 游戏设置按钮 → 打开设置弹窗
    DOM.btnSettings.addEventListener('click', function () {
        HomeEasterEggManager.clearAll();
        SoundPlayer.playClick();
        ModalManager.open('modalSettings');
    });

    // 排行榜按钮 → 打开排行榜弹窗
    DOM.btnLeaderboard.addEventListener('click', function () {
        HomeEasterEggManager.clearAll();
        SoundPlayer.playClick();
        ModalManager.open('modalLeaderboard');
    });

    // 游戏说明按钮 → 打开游戏说明弹窗
    DOM.btnInstructions.addEventListener('click', function () {
        HomeEasterEggManager.clearAll();
        SoundPlayer.playClick();
        ModalManager.open('modalInstructions');
    });

    // 设置弹窗：背景音乐开关
    DOM.toggleMusic.addEventListener('change', function () {
        Settings.toggleMusic();
    });

    // 设置弹窗：音效开关
    DOM.toggleSound.addEventListener('change', function () {
        Settings.toggleSound();
    });

    // 设置弹窗：背景音乐选择卡片
    var musicTrackCards = document.querySelectorAll('.music-track-card');
    musicTrackCards.forEach(function (card) {
        card.addEventListener('click', function () {
            var trackId = card.getAttribute('data-track');
            if (!trackId) return;
            SoundPlayer.playClick();
            if (MusicManager.selectTrack(trackId)) {
                MusicManager.updateTrackPanel();
            }
        });
    });

    // 设置弹窗：重置本地历史记录
    var btnResetHistory = document.getElementById('btnResetHistory');
    if (btnResetHistory) {
        btnResetHistory.addEventListener('click', function () {
            SoundPlayer.playClick();
            var confirmed = window.confirm('确认要重置本地历史记录吗？此操作会清除排行榜、皮肤进度、背景音乐解锁与恶魔道具累计。');
            if (!confirmed) return;
            [
                STORAGE_KEYS.LEADERBOARD_EASY,
                STORAGE_KEYS.LEADERBOARD_NORMAL,
                STORAGE_KEYS.LEADERBOARD_HARD,
                STORAGE_KEYS.LEADERBOARD_TIMED,
                STORAGE_KEYS.SKIN,
                STORAGE_KEYS.TOTAL_SCORE,
                STORAGE_KEYS.MUSIC_TRACK,
                STORAGE_KEYS.TOTAL_EVIL_PROP_COUNT,
                STORAGE_KEYS.SETTINGS,
            ].forEach(function (key) {
                localStorage.removeItem(key);
            });
            Settings.init();
            Leaderboard.init();
            SkinManager.init();
            MusicManager.init();
            EvilCountTracker.reset();
            ModalManager.close('modalSettings');
            alert('本地历史记录已重置，设置已恢复默认。');
        });
    }

    // ---- 难度选择页：返回首页 ----
    DOM.btnBackToHome.addEventListener('click', function () {
        SoundPlayer.playClick();
        PageManager.goHome();
    });

    // ---- 难度选择页：点击难度卡片进入游戏（带防抖） ----
    DOM.diffCards.forEach(function (card) {
        card.addEventListener('click', function () {
            // 【优化】防重复快速点击
            if (GameEngine.isRunning || GameEngine.isInitializing) {
                console.warn('游戏已在运行中，忽略重复点击');
                return;
            }
            SoundPlayer.playClick();
            var difficulty = card.getAttribute('data-difficulty');
            PageManager.goGame();
            // 延迟一帧确保 DOM 渲染完成后再初始化游戏
            setTimeout(function () {
                GameEngine.init(difficulty);
            }, 50);
        });
    });

    // ---- 游戏页：暂停按钮 ----
    var btnPause = document.getElementById('btnPause');
    if (btnPause) {
        btnPause.addEventListener('click', function () {
            SoundPlayer.playClick();
            GameEngine.togglePause();
        });
    }

    // ---- 游戏页：退出按钮 ----
    DOM.btnExitGame.addEventListener('click', function () {
        SoundPlayer.playClick();
        GameEngine.stop();
        BGMPlayer.restoreVolume();
        PageManager.goHome();
        BubbleGenerator.start();
        FishGenerator.start();
    });

    // ---- 游戏结束弹窗：重新游玩（同难度） ----
    DOM.btnRestart.addEventListener('click', function () {
        SoundPlayer.playClick();
        ModalManager.close('modalGameOver');
        FireworkSystem.stop(); // 【新增】停止烟花
        BGMPlayer.restoreVolume();
        var prevDifficulty = GameEngine.difficulty || 'normal';
        PageManager.goGame();
        setTimeout(function () {
            GameEngine.init(prevDifficulty);
        }, 50);
    });

    // ---- 游戏结束弹窗：重新选择难度 ----
    var btnGoDifficulty = document.getElementById('btnGoDifficulty');
    if (btnGoDifficulty) {
        btnGoDifficulty.addEventListener('click', function () {
            SoundPlayer.playClick();
            ModalManager.close('modalGameOver');
            FireworkSystem.stop(); // 【新增】停止烟花
            BGMPlayer.restoreVolume();
            PageManager.goDifficulty();
            BubbleGenerator.start();
            FishGenerator.start();
        });
    }

    // ---- 游戏结束弹窗：返回首页 ----
    var btnGoHome = document.getElementById('btnGoHome');
    if (btnGoHome) {
        btnGoHome.addEventListener('click', function () {
            SoundPlayer.playClick();
            ModalManager.close('modalGameOver');
            FireworkSystem.stop(); // 【新增】停止烟花
            BGMPlayer.restoreVolume();
            PageManager.goHome();
            BubbleGenerator.start();
            FishGenerator.start();
        });
    }

    // ---- 【新增】限时挑战模式按钮 ----
    var btnTimedMode = document.getElementById('btnTimedMode');
    if (btnTimedMode) {
        btnTimedMode.addEventListener('click', function () {
            if (GameEngine.isRunning || GameEngine.isInitializing) {
                console.warn('游戏已在运行中，忽略重复点击');
                return;
            }
            SoundPlayer.playClick();
            PageManager.goGame();
            setTimeout(function () {
                GameEngine.init('timed');
            }, 50);
        });
    }

    // ---- 【新增】皮肤面板点击事件 ----
    var skinCards = document.querySelectorAll('.skin-card');
    skinCards.forEach(function (card) {
        card.addEventListener('click', function () {
            var skinId = card.getAttribute('data-skin');
            if (!skinId) return;
            var success = SkinManager.selectSkin(skinId);
            if (success) {
                SoundPlayer.playClick();
            }
        });
    });

    // ---- 猫咪交互彩蛋 ----
    // 点击小猫会有反应（轻快弹跳 + 音效 + 彩蛋图片）
    DOM.mainCat.addEventListener('click', function () {
        SoundPlayer.playClick();

        // 随机展示首页彩蛋图像
        var eggs = ASSET_PATHS.images.homeEasterEgg || [];
        if (eggs.length > 0) {
            var idx = Math.floor(Math.random() * eggs.length);
            var eggSrc = eggs[idx];
            var eggEl = document.createElement('img');
            eggEl.className = 'home-easter-egg-img';
            eggEl.src = eggSrc;
            eggEl.alt = '彩蛋';
            eggEl.style.position = 'fixed';
            eggEl.style.pointerEvents = 'none';
            eggEl.style.zIndex = 1050;
            // 随机宽度 100-150px，高度自适应，透明度 50%
            var w = 100 + Math.floor(Math.random() * 51);
            eggEl.style.width = w + 'px';
            eggEl.style.height = 'auto';
            eggEl.style.objectFit = 'contain'; // 自适应缩放，防止拉伸变形
            eggEl.style.opacity = '0';
            eggEl.style.borderRadius = '12px';
            eggEl.style.boxShadow = '0 18px 36px rgba(0,0,0,0.22)';

            // 居中显示在页面上方安全区域，避免遮挡主要按钮
            eggEl.style.left = '50%';
            eggEl.style.top = '38%';
            eggEl.style.transform = 'translate(-50%, -50%)';
            eggEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            // 图片加载失败时自动隐藏，不影响页面
            eggEl.onerror = function () {
                if (eggEl.parentNode) eggEl.parentNode.removeChild(eggEl);
            };
            document.body.appendChild(eggEl);

            // 注册彩蛋生命周期，绑定三个定时器
            var eggData = { el: eggEl, timerShow: null, timerFadeOut: null, timerRemove: null };
            eggData.timerShow = setTimeout(function () {
                eggEl.style.opacity = '0.5';
                eggEl.style.transform = 'translate(-50%, -60%) scale(1.02)';
            }, 20);
            // 停留 2s - 2.5s 后渐隐
            var stay = 2000 + Math.floor(Math.random() * 501);
            eggData.timerFadeOut = setTimeout(function () {
                eggEl.style.opacity = '0';
                eggEl.style.transform = 'translate(-50%, -70%) scale(0.98)';
            }, stay);
            eggData.timerRemove = setTimeout(function () {
                if (eggEl.parentNode) eggEl.parentNode.removeChild(eggEl);
            }, stay + 400);
            HomeEasterEggManager.register(eggData);
        }

        // 临时加速弹跳
        DOM.mainCat.style.animation = 'none';
        // 强制回流后重新设置动画
        void DOM.mainCat.offsetWidth;
        DOM.mainCat.style.animation = 'catIdle 0.4s ease-in-out 3';
        // 恢复原始动画
        setTimeout(function () {
            DOM.mainCat.style.animation = 'catIdle 2.5s ease-in-out infinite';
        }, 1200);
    });
}

/* ==================== 首次用户交互初始化 ==================== */

/**
 * 由于浏览器的自动播放策略，音频必须在用户首次交互后才能开始。
 * 此函数在用户首次点击/触摸页面时初始化音频系统。
 */
function initAudioOnFirstInteraction() {
    var initialized = false;

    function onInteraction() {
        if (initialized) return;
        initialized = true;

        // 初始化音频
        BGMPlayer.init();
        // 如果设置中音乐是开启的，则开始播放
        if (Settings.data.musicEnabled) {
            BGMPlayer.start();
        }

        // 移除事件监听（只需要第一次交互）
        document.removeEventListener('click', onInteraction);
        document.removeEventListener('touchstart', onInteraction);
        document.removeEventListener('keydown', onInteraction);
    }

    // 监听多种交互方式
    document.addEventListener('click', onInteraction);
    document.addEventListener('touchstart', onInteraction);
    document.addEventListener('keydown', onInteraction);
}

/* ==================== 扩展接口注册 ==================== */

/**
 * 将核心功能注册到全局 CatGame 对象，
 * 供后续开发的游戏页面、关卡选择页面等调用。
 */
function registerExtensions() {
    var CG = window.CatGame;

    // ---- 页面导航 ----
    /** 跳转到游戏难度选择页 */
    CG.navigateToGame = function () {
        PageManager.goDifficulty();
    };

    /** 跳转到关卡选择页面（即难度选择页） */
    CG.navigateToLevelSelect = function () {
        PageManager.goDifficulty();
    };

    /** 直接启动指定难度的游戏 */
    CG.startGame = function (difficulty) {
        PageManager.goGame();
        setTimeout(function () {
            GameEngine.init(difficulty || 'normal');
        }, 50);
    };

    /** 获取难度配置表（方便外部读取/修改） */
    CG.getDifficultyConfig = function () {
        return DIFFICULTY_CONFIG;
    };

    // ---- 数据操作 ----
    /** 保存分数到排行榜（分难度） */
    CG.saveScore = function (difficulty, score) {
        return Leaderboard.saveScore(difficulty, score);
    };

    /** 获取所有难度排行榜数据 */
    CG.getLeaderboard = function () {
        return Leaderboard.getAllScores();
    };

    /** 获取指定难度最高分 */
    CG.getHighScore = function (difficulty) {
        return Leaderboard.getHighScore(difficulty || 'normal');
    };

    /** 获取当前设置 */
    CG.getSettings = function () {
        return Settings.getSettings();
    };

    // ---- 弹窗操作 ----
    /** 打开指定弹窗 */
    CG.openModal = function (modalId) {
        ModalManager.open(modalId);
    };

    /** 关闭当前弹窗 */
    CG.closeModal = function () {
        ModalManager.closeCurrent();
    };

    // ---- 音频操作 ----
    /** 切换背景音乐 */
    CG.toggleMusic = function () {
        return Settings.toggleMusic();
    };

    /** 切换音效 */
    CG.toggleSound = function () {
        return Settings.toggleSound();
    };

    /** 播放点击音效 */
    CG.playClickSound = function () {
        SoundPlayer.playClick();
    };

    // ---- 动态装饰操作 ----
    /** 暂停所有动态装饰 */
    CG.pauseDecorations = function () {
        BubbleGenerator.stop();
        FishGenerator.stop();
    };

    /** 恢复所有动态装饰 */
    CG.resumeDecorations = function () {
        BubbleGenerator.start();
        FishGenerator.start();
    };
}

/* ==================== 游戏难度配置 ==================== */
/**
 * 【优化】难度参数配置表（全局可修改，集中管理便于调试）
 * 每项包含：
 *   - label: 难度显示名称
 *   - fishSpeed: 鱼下落速度（px/帧，约 60fps 基准）
 *   - obstacleInterval: 障碍物生成间隔（毫秒）
 *   - fishInterval: 鱼生成间隔（毫秒）
 *   - scorePerFish: 接到普通小鱼的得分（大号鱼在此基础上 +5）
 *   - lives: 初始生命数
 *   - fastFishChance: 困难模式高速鱼出现概率（0~1）
 *   - maxItems: 同时存在的最大物品数量上限
 *   - obstacleTypes: 该难度出现的障碍物类型列表
 *
 * 修改提示：直接调整下方数值即可更改游戏平衡性
 */
const DIFFICULTY_CONFIG = {
    easy: {
        label: '简单',
        fishSpeed: 2,              // 最慢下落，新手友好
        obstacleInterval: 2800,    // 障碍物间隔最长（2.8秒），容错率高
        fishInterval: 1300,        // 鱼生成间隔长（1.3秒）
        scorePerFish: 5,           // 普通小鱼 5 分（基础分降低 50%）
        lives: 3,
        fastFishChance: 0,         // 无高速鱼
        maxItems: 20,              // 最大物品数上限
        obstacleTypes: ['🪨'],     // 只有石头
    },
    normal: {
        label: '一般',
        fishSpeed: 4,              // 中等速度
        obstacleInterval: 1500,    // 障碍物间隔适中（1.5秒）
        fishInterval: 800,         // 鱼生成间隔适中（0.8秒）
        scorePerFish: 8,           // 普通小鱼 8 分（基础分降低 50%）
        lives: 3,
        fastFishChance: 0.1,       // 10% 概率出现高速鱼
        maxItems: 30,              // 最大物品数上限
        obstacleTypes: ['🪨', '💣'], // 石头+炸弹
    },
    hard: {
        label: '困难',
        fishSpeed: 7,              // 快速下落，手速挑战
        obstacleInterval: 700,     // 障碍物间隔短（0.7秒），高频刷新
        fishInterval: 450,         // 鱼生成间隔短（0.45秒）
        scorePerFish: 10,          // 普通小鱼 10 分（基础分降低 50%）
        lives: 3,
        fastFishChance: 0.25,      // 25% 概率出现高速移动鱼
        maxItems: 40,              // 最大物品数上限
        obstacleTypes: ['🪨', '💣', '🐚'], // 石头+炸弹+贝壳
    },
};

/**
 * 【优化】小鱼种类定义
 * type: 鱼类型标识
 * emoji: 外观
 * size: 'small' | 'medium' | 'large'（大号鱼 +5 分）
 * weight: 随机生成权重（越大越容易出现）
 */
const FISH_TYPES = [
    // 统一基础得分：小鱼=2，中型=3，大型=5（与难度无关）
    { type: 'small',  emoji: '🐟', size: 'small',  weight: 50, baseScore: 2 },
    { type: 'medium', emoji: '🐠', size: 'medium', weight: 35, baseScore: 3 },
    { type: 'large',  emoji: '🐡', size: 'large',  weight: 15, baseScore: 5 },
];

/* ==================== 道具系统配置 ==================== */
/**
 * 【新增】道具类型配置表
 * 每种道具定义：id、emoji、名称、描述、效果时长、参数
 * 所有可调参数集中在此对象，方便后续调整
 *
 * 修改提示：直接调整下方数值即可更改道具效果与平衡性
 */
const POWERUP_CONFIG = [
    {
        id: 'doubleScore',         // 唯一标识
        emoji: '🐠',               // 显示图标
        name: '双倍分数',           // 道具名称
        desc: '10秒内吃鱼得分×2',    // 简短描述
        duration: 10000,           // 效果持续时间（毫秒）
        effectType: 'buff',        // buff | debuff | instant
        // 效果参数
        scoreMultiplier: 2,        // 得分倍率
        broadcastText: '双倍得分开启！', // 拾取时全屏提示文字
    },
    {
        id: 'heal',
        emoji: '❤️',
        name: '生命恢复',
        desc: '恢复1点生命值（上限3）',
        duration: 0,               // 即时生效，无持续时长
        effectType: 'instant',
        healAmount: 1,
        broadcastText: '生命值恢复！',
    },
    {
        id: 'shield',
        emoji: '🛡️',
        name: '无敌护盾',
        desc: '8秒内免疫障碍物伤害',
        duration: 8000,
        effectType: 'buff',
        broadcastText: '护盾保护中！',
    },
    {
        id: 'speedBoost',
        emoji: '⚡',
        name: '加速道具',
        desc: '5秒内移动速度提升2倍',
        duration: 5000,
        effectType: 'buff',
        playerSpeedMultiplier: 2,
        broadcastText: '加速中！',
    },
    {
        id: 'slowDown',
        emoji: '⏳',
        name: '全局减速',
        desc: '6秒内所有物体速度减半',
        duration: 6000,
        effectType: 'buff',
        speedMultiplier: 0.5,      // 全局速度倍率
        broadcastText: '时间减速！',
    },
    {
        id: 'crabDebuff',
        emoji: '🦀',
        name: '减速惩罚',
        desc: '3秒内小猫移动变慢',
        duration: 3000,
        effectType: 'debuff',
        playerSpeedMultiplier: 0.3, // 玩家移动速度倍率
        broadcastText: '🦀 被螃蟹夹住了！',
    },
];

/** 【新增】道具掉落控制参数 */
const POWERUP_SPAWN_CONFIG = {
    spawnEveryN: 10,              // 每生成 N 个普通物品后掉落 1 个道具
    maxOnScreen: 3,               // 屏幕内同时存在的道具最大数量
    spawnChance: 0.6,             // 达成条件后的实际生成概率（60%）
};

/* ==================== 道具系统管理器 ==================== */
/**
 * 【新增】PowerUpManager
 * 负责道具的生成调度、碰撞拾取处理、限时效果计时、护盾动画控制
 * 使用独立定时器追踪每个生效中的增益效果
 *
 * 核心设计：
 * - activeEffect: { id, name, emoji, startTime, duration, endTime, ...params }
 * - 同一时间仅保留一个限时增益，新道具覆盖旧道具
 * - 即时效果（爱心）不占用 activeEffect 槽位
 * - 暂停时所有倒计时同步暂停，恢复后继续
 */
const PowerUpManager = {
    /** 当前生效的限时增益效果（null 表示无生效道具） */
    activeEffect: null,
    /** 效果淘汰定时器 ID（用于在到期后清除效果） */
    effectTimeoutId: null,
    /** 本局各道具拾取次数统计 { doubleScore: 0, heal: 1, ... } */
    pickupStats: {},
    /** 道具状态指示器 DOM */
    indicatorEl: null,
    /** 暂停时剩余时间缓存（毫秒） */
    _pausedRemaining: 0,
    /** 暂停时间点 */
    _pausedAt: 0,
    /** 减速效果原始速度缓存 */
    _originalSpeed: null,

    /**
     * 初始化（每局开始时调用）
     * 重置所有状态、统计、定时器
     */
    init: function () {
        this.clearAllEffects();
        // 重置拾取统计
        this.pickupStats = {};
        POWERUP_CONFIG.concat([EVIL_PROP_CONFIG]).forEach(function (p) {
            this.pickupStats[p.id] = 0;
        }.bind(this));
        this._originalSpeed = null;
        this.hideIndicator();
    },

    /**
     * 处理道具被拾取
     * @param {string} powerupId - 道具 ID
     * @returns {boolean} 是否成功激活
     */
    activate: function (powerupId) {
        var config = null;
        for (var i = 0; i < POWERUP_CONFIG.length; i++) {
            if (POWERUP_CONFIG[i].id === powerupId) { config = POWERUP_CONFIG[i]; break; }
        }
        if (!config && powerupId === EVIL_PROP_CONFIG.id) {
            config = EVIL_PROP_CONFIG;
        }
        if (!config) return false;

        // 统计 +1
        this.pickupStats[powerupId] = (this.pickupStats[powerupId] || 0) + 1;

        var gameAreaEl = document.getElementById('gameArea');

        // ---- 恶魔道具：清空连击并计数 ----
        if (config.id === EVIL_PROP_CONFIG.id) {
            ComboSystem.reset();
            MusicManager.addEvilCount(1);
            EvilCountTracker.increment(1);
        }

        // ---- 即时效果：爱心 ----
        if (config.effectType === 'instant') {
            // 满血检查（加空值防护）
            if (!GameEngine.config || GameEngine.lives >= GameEngine.config.lives) {
                this.showToast('❤️ 生命值已满，无法恢复', gameAreaEl);
                return false; // 道具不生效
            }
            GameEngine.lives = Math.min(GameEngine.config.lives, GameEngine.lives + (config.healAmount || 1));
            GameEngine.updateHUD();
            // 生命值高亮闪烁
            this.flashLivesHUD();
            GameSounds.playPowerup('heal');
            this.showBroadcast(config.broadcastText || '生命恢复！', gameAreaEl);
            return true;
        }

        // ---- 限时效果：覆盖旧效果 ----
        if (this.activeEffect) {
            this.clearTimedEffect();
        }

        var now = Date.now();
        this.activeEffect = {
            id: config.id,
            name: config.name,
            emoji: config.emoji,
            startTime: now,
            duration: config.duration,
            endTime: now + config.duration,
            // 各类型特有参数
            scoreMultiplier: config.scoreMultiplier || 1,
            speedMultiplier: config.speedMultiplier || 1,
            playerSpeedMultiplier: config.playerSpeedMultiplier || 1,
        };

        // 设置淘汰定时器
        var self = this;
        this.effectTimeoutId = setTimeout(function () {
            self.clearTimedEffect();
        }, config.duration);

        // ---- 护盾视觉 ----
        if (powerupId === 'shield') {
            var playerEl = document.getElementById('gamePlayer');
            if (playerEl) playerEl.classList.add('shield-active');
        }

        // ---- 减速效果：应用全局速度 ----
        if (powerupId === 'slowDown' && GameEngine.config && GameEngine.difficulty && DIFFICULTY_CONFIG[GameEngine.difficulty]) {
            if (this._originalSpeed === null) {
                this._originalSpeed = GameEngine.config.fishSpeed;
            }
            // 修改 config 中的速度引用（实际是 DIFFICULTY_CONFIG 对象）
            DIFFICULTY_CONFIG[GameEngine.difficulty].fishSpeed = Math.round(GameEngine.config.fishSpeed * config.speedMultiplier);
            GameEngine.config = DIFFICULTY_CONFIG[GameEngine.difficulty];
        }

        // ---- 减速惩罚：标记 ----
        // 实际速度调整在 updatePlayerPosition 中读取

        // 更新 HUD 指示器
        this.updateIndicator();

        // 播放音效
        GameSounds.playPowerup(powerupId);

        // 全屏提示
        if (config.broadcastText) {
            this.showBroadcast(config.broadcastText, gameAreaEl);
        }

        return true;
    },

    /**
     * 清除当前限时效果（到期或覆盖时调用）
     */
    clearTimedEffect: function () {
        if (!this.activeEffect) return;

        // 取消护盾视觉
        if (this.activeEffect.id === 'shield') {
            var playerEl = document.getElementById('gamePlayer');
            if (playerEl) playerEl.classList.remove('shield-active');
        }

        // 恢复减速
        if (this.activeEffect.id === 'slowDown' && this._originalSpeed !== null && GameEngine.difficulty && DIFFICULTY_CONFIG[GameEngine.difficulty]) {
            DIFFICULTY_CONFIG[GameEngine.difficulty].fishSpeed = this._originalSpeed;
            GameEngine.config = DIFFICULTY_CONFIG[GameEngine.difficulty];
            this._originalSpeed = null;
        }

        // 清理定时器
        if (this.effectTimeoutId) {
            clearTimeout(this.effectTimeoutId);
            this.effectTimeoutId = null;
        }

        this.activeEffect = null;
        this.hideIndicator();
    },

    /**
     * 清除所有效果（游戏结束/退出时调用）
     */
    clearAllEffects: function () {
        this.clearTimedEffect();
        // 确保速度恢复（加空值防护）
        if (this._originalSpeed !== null && GameEngine.difficulty && DIFFICULTY_CONFIG[GameEngine.difficulty]) {
            DIFFICULTY_CONFIG[GameEngine.difficulty].fishSpeed = this._originalSpeed;
            if (GameEngine.config) {
                GameEngine.config = DIFFICULTY_CONFIG[GameEngine.difficulty];
            }
            this._originalSpeed = null;
        }
        if (this.effectTimeoutId) {
            clearTimeout(this.effectTimeoutId);
            this.effectTimeoutId = null;
        }
        this.activeEffect = null;
        this._pausedRemaining = 0;
        this._pausedAt = 0;
        // 移除护盾样式
        var playerEl = document.getElementById('gamePlayer');
        if (playerEl) playerEl.classList.remove('shield-active');
        this.hideIndicator();
    },

    /**
     * 暂停时调用：冻结效果计时
     */
    pause: function () {
        if (!this.activeEffect) return;
        // 取消到期定时器
        if (this.effectTimeoutId) {
            clearTimeout(this.effectTimeoutId);
            this.effectTimeoutId = null;
        }
        // 记录剩余时间
        this._pausedAt = Date.now();
        this._pausedRemaining = Math.max(0, this.activeEffect.endTime - this._pausedAt);
    },

    /**
     * 恢复时调用：重新计算结束时间
     */
    resume: function () {
        if (!this.activeEffect || this._pausedRemaining <= 0) return;
        var now = Date.now();
        this.activeEffect.startTime = now;
        this.activeEffect.endTime = now + this._pausedRemaining;
        this.activeEffect.duration = this._pausedRemaining;
        var self = this;
        this.effectTimeoutId = setTimeout(function () {
            self.clearTimedEffect();
        }, this._pausedRemaining);
        this._pausedRemaining = 0;
        this._pausedAt = 0;
        this.updateIndicator();
    },

    /**
     * 检查护盾是否生效（被 loseLife 调用）
     * @returns {boolean} true=护盾生效中，应免疫伤害
     */
    isShieldActive: function () {
        return this.activeEffect && this.activeEffect.id === 'shield';
    },

    /**
     * 获取当前分数倍率
     * @returns {number} 倍率（默认 1）
     */
    getScoreMultiplier: function () {
        if (!this.activeEffect || this.activeEffect.id !== 'doubleScore') return 1;
        return this.activeEffect.scoreMultiplier || 1;
    },

    /**
     * 获取玩家速度倍率（减速惩罚用）
     * @returns {number} 倍率（默认 1）
     */
    getPlayerSpeedMultiplier: function () {
        if (!this.activeEffect) return 1;
        // 加速道具（speedBoost）或减速惩罚（crabDebuff）都会通过 playerSpeedMultiplier 生效
        if (this.activeEffect.playerSpeedMultiplier) return this.activeEffect.playerSpeedMultiplier || 1;
        return 1;
    },

    /* ==================== UI 更新 ==================== */

    /**
     * 更新 HUD 右上角道具状态指示器
     */
    updateIndicator: function () {
        var el = document.getElementById('powerupIndicator');
        if (!el) return;

        if (!this.activeEffect) {
            this.hideIndicator();
            return;
        }

        var remaining = Math.max(0, Math.ceil((this.activeEffect.endTime - Date.now()) / 1000));
        var iconEl = document.getElementById('powerupIndicatorIcon');
        var textEl = document.getElementById('powerupIndicatorText');
        var timerEl = document.getElementById('powerupIndicatorTimer');

        if (iconEl) iconEl.textContent = this.activeEffect.emoji;
        if (textEl) textEl.textContent = this.activeEffect.name;
        if (timerEl) timerEl.textContent = remaining + 's';

        el.style.display = 'flex';
    },

    /** 隐藏指示器 */
    hideIndicator: function () {
        var el = document.getElementById('powerupIndicator');
        if (el) el.style.display = 'none';
    },

    /**
     * 显示全屏提示文字
     * @param {string} text - 提示文字
     * @param {HTMLElement} gameAreaEl - 游戏区域元素
     */
    showBroadcast: function (text, gameAreaEl) {
        if (!gameAreaEl) return;
        var broadcast = document.createElement('div');
        broadcast.className = 'game-broadcast';
        broadcast.textContent = text;
        gameAreaEl.appendChild(broadcast);
        setTimeout(function () {
            if (broadcast.parentNode) broadcast.parentNode.removeChild(broadcast);
        }, 1900);
    },

    /**
     * 显示短暂提示（满血等）
     * @param {string} text - 提示文字
     * @param {HTMLElement} gameAreaEl - 游戏区域元素
     */
    showToast: function (text, gameAreaEl) {
        if (!gameAreaEl) return;
        var toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.textContent = text;
        gameAreaEl.appendChild(toast);
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 1600);
    },

    /**
     * 生命值 HUD 闪烁高亮
     */
    flashLivesHUD: function () {
        var hudLivesEl = document.getElementById('hudLives');
        if (!hudLivesEl) return;
        // 给生命值加临时高亮动画
        hudLivesEl.style.transition = 'transform 0.15s ease, filter 0.15s ease';
        hudLivesEl.style.transform = 'scale(1.3)';
        hudLivesEl.style.filter = 'brightness(1.5) drop-shadow(0 0 8px #FFD700)';
        setTimeout(function () {
            if (hudLivesEl) {
                hudLivesEl.style.transform = 'scale(1)';
                hudLivesEl.style.filter = '';
                hudLivesEl.style.transition = 'transform 0.3s ease, filter 0.3s ease';
            }
        }, 200);
    },

    /**
     * 获取本局道具统计（供结算弹窗使用）
     * @returns {Object} 道具统计数据
     */
    getStats: function () {
        return Object.assign({}, this.pickupStats);
    },

    /**
     * 获取本局道具拾取总次数
     * @returns {number}
     */
    getTotalPickups: function () {
        var total = 0;
        for (var k in this.pickupStats) {
            total += this.pickupStats[k] || 0;
        }
        return total;
    },
};

/* ==================== 小猫皮肤系统 ==================== */
/**
 * 【新增】SkinManager
 * 管理CSS绘制小猫皮肤的解锁、切换、持久化
 * 皮肤数据（解锁条件用累计总分判断）：
 * - orange: 橘色田园猫，默认已解锁
 * - youya: 优雅猫，累计总分 ≥ 5000 分解锁
 * - stand: 罚站猫，累计总分 ≥ 10000 分解锁
 * - jiquan: 击拳猫，累计总分 ≥ 30000 分解锁
 * - rencomehere: 人你过来猫，累计总分 ≥ 50000 分解锁
 */
const SkinManager = {
    /** 当前选中的皮肤 ID */
    currentSkin: 'orange',
    /** 皮肤定义 */
    skins: {
        orange: { id: 'orange', name: '橘色田园猫', requiredScore: 0, cssClass: 'skin-orange', preview: '', runtimeImage: '' },  // CSS纯绘制，无需外部图片
        youya:  { id: 'youya',  name: '优雅猫',      requiredScore: 5000,  cssClass: 'skin-youya',  preview: ASSET_PATHS.images.skins.youya,    runtimeImage: ASSET_PATHS.images.skins.youya },
        stand:  { id: 'stand',  name: '罚站猫',      requiredScore: 10000, cssClass: 'skin-stand',  preview: ASSET_PATHS.images.skins.stand,   runtimeImage: ASSET_PATHS.images.skins.stand },
        jiquan: { id: 'jiquan', name: '击拳猫',      requiredScore: 30000, cssClass: 'skin-jiquan', preview: ASSET_PATHS.images.skins.jiquan,   runtimeImage: ASSET_PATHS.images.skins.jiquan },
        rencomehere: { id: 'rencomehere', name: '人你过来猫', requiredScore: 50000, cssClass: 'skin-rencomehere', preview: ASSET_PATHS.images.skins.rencomehere, runtimeImage: ASSET_PATHS.images.skins.rencomehere },
    },
    /** 累计总分（跨局累加） */
    totalScore: 0,

    /**
     * 初始化：加载皮肤选择和累计总分
     */
    init: function () {
        var self = this;
        this.currentSkin = loadFromStorage(STORAGE_KEYS.SKIN, 'orange');
        this.totalScore = loadFromStorage(STORAGE_KEYS.TOTAL_SCORE, 0);
        // 尝试从项目根目录的 skin_data.json 加载持久化存档（优先级高于 localStorage）
        loadSkinSave().then(function (data) {
            if (data && data.skins) {
                try {
                    // 合并存档信息到内存皮肤解锁状态
                    Object.keys(self.skins).forEach(function (sid) {
                        if (data.skins[sid] && typeof data.skins[sid].unlocked === 'boolean') {
                            if (data.skins[sid].unlocked) {
                                self.skins[sid].__forceUnlocked = true;
                            } else {
                                // 明确关闭强制解锁标记
                                self.skins[sid].__forceUnlocked = false;
                            }
                        } else {
                            self.skins[sid].__forceUnlocked = false;
                        }
                    });
                    // 如果存档中有累计总分，覆盖内存 totalScore
                    if (typeof data.totalScore === 'number') {
                        self.totalScore = data.totalScore;
                        saveToStorage(STORAGE_KEYS.TOTAL_SCORE, self.totalScore);
                    }
                } catch (e) {
                    console.warn('解析 skin_data.json 内容异常，使用默认值', e);
                }
            } else {
                // 未发现有效存档：初始化为默认配置（仅 orange 解锁），并清理任何残留强制标记
                Object.keys(self.skins).forEach(function (sid) { self.skins[sid].__forceUnlocked = false; });
                self.skins.orange.__forceUnlocked = true;
                self.totalScore = loadFromStorage(STORAGE_KEYS.TOTAL_SCORE, 0) || 0;
            }

            // 校验皮肤合法性
            if (!self.skins[self.currentSkin]) self.currentSkin = 'orange';
            self.applySkin();
            self.updateSkinPanel();
        }).catch(function () {
            // 无法加载文件则退回原有 localStorage 行为，并确保初始化默认解锁
            Object.keys(self.skins).forEach(function (sid) { self.skins[sid].__forceUnlocked = false; });
            self.skins.orange.__forceUnlocked = true;
            if (!self.skins[self.currentSkin]) self.currentSkin = 'orange';
            self.applySkin();
            self.updateSkinPanel();
        });
    },

    /**
     * 应用当前皮肤到游戏内玩家元素
     */
    applySkin: function () {
        var playerEl = document.getElementById('gamePlayer');
        if (!playerEl) return;
        // 移除所有皮肤类
        var self = this;
        Object.keys(this.skins).forEach(function (k) {
            playerEl.classList.remove(self.skins[k].cssClass);
        });
        // 添加当前皮肤类
        playerEl.classList.add(this.skins[this.currentSkin].cssClass);
        playerEl.setAttribute('data-skin', this.currentSkin);

        // 运行时以图片/GIF渲染当前皮肤，保留 CSS 绘制作为后备
        var skinData = this.skins[this.currentSkin] || {};
        var runtimeSrc = skinData.runtimeImage || '';
        var skinImg = playerEl.querySelector('.game-player-skin-img');
        if (!skinImg) {
            skinImg = document.createElement('img');
            skinImg.className = 'game-player-skin-img';
            playerEl.appendChild(skinImg);
        }
        if (runtimeSrc) {
            skinImg.src = runtimeSrc;
            skinImg.alt = skinData.name + ' 皮肤';
            skinImg.style.display = '';
            skinImg.onerror = function () {
                // 图片加载失败时回退到CSS绘制
                skinImg.style.display = 'none';
                playerEl.classList.remove('image-skin');
            };
            playerEl.classList.add('image-skin');
        } else {
            skinImg.removeAttribute('src');
            skinImg.alt = '';
            skinImg.style.display = 'none';
            playerEl.classList.remove('image-skin');
        }
    },

    /**
     * 检查指定皮肤是否已解锁
     * @param {string} skinId
     * @returns {boolean}
     */
    isUnlocked: function (skinId) {
        var skin = this.skins[skinId];
        if (!skin) return false;
        // 优先检查存档强制解锁标记（兼容外部存档写入）
        if (skin.__forceUnlocked) return true;
        return this.totalScore >= skin.requiredScore;
    },

    /**
     * 切换皮肤（仅在已解锁时生效）
     * @param {string} skinId
     * @returns {boolean} 是否切换成功
     */
    selectSkin: function (skinId) {
        if (!this.isUnlocked(skinId)) return false;
        if (this.currentSkin === skinId) return true;
        this.currentSkin = skinId;
        saveToStorage(STORAGE_KEYS.SKIN, skinId);
        this.applySkin();
        this.updateSkinPanel();
        return true;
    },

    /**
     * 累加总分并检查解锁新皮肤
     * @param {number} score - 本局得分
     */
    addScore: function (score) {
        if (score <= 0) return;
        var oldTotal = this.totalScore;
        this.totalScore = Math.min(99999, this.totalScore + Math.floor(score)); // 防溢出
        saveToStorage(STORAGE_KEYS.TOTAL_SCORE, this.totalScore);

        // 检查是否有新解锁
        var newlyUnlocked = [];
        var self = this;
        Object.keys(this.skins).forEach(function (k) {
            if (oldTotal < self.skins[k].requiredScore && self.totalScore >= self.skins[k].requiredScore) {
                newlyUnlocked.push(self.skins[k].name);
            }
        });
        this.updateSkinPanel();
        // 如果有新皮肤，显示即时提示并持久化到本地存档
        if (newlyUnlocked && newlyUnlocked.length > 0) {
            this.showUnlockNotification(newlyUnlocked);
            // 立即更新内存与存档：构建保存对象
            var saveObj = {
                skins: {},
                leaderboard: Leaderboard.getAllScores(),
                totalScore: this.totalScore,
            };
            Object.keys(this.skins).forEach(function (sid) {
                saveObj.skins[sid] = { unlocked: (self.isUnlocked(sid) || !!self.skins[sid].__forceUnlocked) };
            });
            // 异步写入项目根目录的 skin_data.json（若无写入权限，忽略错误）
            saveSkinSave(saveObj).then(function (ok) {
                if (!ok) console.warn('未能写入 skin_data.json，建议以 server.py 启动开发服务器以支持写入。');
            });
        }
        return newlyUnlocked;
    },

    /**
     * 在屏幕上显示解锁通知（短暂弹窗）
     * @param {string[]} names
     */
    showUnlockNotification: function (names) {
        var gameArea = document.getElementById('gameArea') || document.body;
        var note = document.createElement('div');
        note.className = 'skin-unlock-toast';
        note.textContent = '🎉 解锁皮肤：' + names.join('、');
        note.style.position = 'fixed';
        note.style.left = '50%';
        note.style.top = '14%';
        note.style.transform = 'translateX(-50%)';
        note.style.padding = '10px 14px';
        note.style.background = 'rgba(255,255,255,0.95)';
        note.style.borderRadius = '10px';
        note.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        note.style.zIndex = 9999;
        document.body.appendChild(note);
        // 播放提示音
        SoundPlayer.playClick();
        setTimeout(function () {
            if (note.parentNode) note.parentNode.removeChild(note);
        }, 2200);
    },

    /**
     * 刷新设置面板中的皮肤UI状态
     */
    updateSkinPanel: function () {
        var self = this;
        Object.keys(this.skins).forEach(function (skinId) {
            var card = document.getElementById('skinCard' + skinId.charAt(0).toUpperCase() + skinId.slice(1));
            if (!card) return;
            var isUnlocked = self.isUnlocked(skinId);
            var isSelected = self.currentSkin === skinId;

            card.className = 'skin-card skin-' + skinId + (isUnlocked ? ' unlocked' : ' locked') + (isSelected ? ' selected' : '');

            var previewImg = card.querySelector('.skin-preview img');
            var previewDiv = card.querySelector('.skin-preview');
            if (previewImg && self.skins[skinId]) {
                if (self.skins[skinId].preview) {
                    previewImg.src = self.skins[skinId].preview;
                    previewImg.alt = self.skins[skinId].name + ' 预览';
                    previewImg.style.display = '';
                    if (previewDiv) previewDiv.classList.remove('no-preview-img');
                } else {
                    // 无外部图片时显示CSS迷你猫（仅橘色猫默认皮肤）
                    previewImg.removeAttribute('src');
                    previewImg.alt = '';
                    previewImg.style.display = 'none';
                    if (previewDiv) previewDiv.classList.add('no-preview-img');
                }
            }
            // 图片加载失败时自动隐藏，不影响页面布局
            if (previewImg && !previewImg.onerror) {
                previewImg.onerror = function () {
                    previewImg.style.display = 'none';
                    if (previewDiv) previewDiv.classList.add('no-preview-img');
                };
            }
        });

        // 更新状态文字（解锁显示绿色已解锁，未解锁显示需要分数）并控制可点击性
        Object.keys(this.skins).forEach(function (skinId) {
            var card = document.getElementById('skinCard' + skinId.charAt(0).toUpperCase() + skinId.slice(1));
            if (!card) return;
            var statusEl = card.querySelector('.skin-status');
            var isUnlocked = self.isUnlocked(skinId);
            if (statusEl) {
                if (isUnlocked) {
                    statusEl.textContent = '✅ 已解锁';
                    statusEl.classList.remove('locked-text');
                    statusEl.classList.add('unlocked-text');
                    card.style.pointerEvents = 'auto';
                    card.setAttribute('aria-disabled', 'false');
                } else {
                    statusEl.textContent = '🔒 累计' + self.skins[skinId].requiredScore + '分解锁';
                    statusEl.classList.remove('unlocked-text');
                    statusEl.classList.add('locked-text');
                    // 置灰不可选
                    card.style.pointerEvents = 'none';
                    card.setAttribute('aria-disabled', 'true');
                }
            }
        });
    },
};

/* ==================== 连击系统 ==================== */
/**
 * 【新增】ComboSystem
 * 连续成功吃到小鱼累积连击数，碰到障碍物清零
 * 连击额外加分：combo×2
 * 里程碑弹字：5→GOOD, 10→GREAT, 20→UNBELIEVABLE
 * 同档位一局仅播一次
 */
const ComboSystem = {
    /** 当前连击数 */
    count: 0,
    /** 本局最高连击 */
    maxCombo: 0,
    /** 已触发的里程碑档位（防止重复弹字） */
    _triggeredMilestones: {},

    /** 每局初始化 */
    init: function () {
        this.count = 0;
        this.maxCombo = 0;
        this._triggeredMilestones = {};
        this.hideCombo();
    },

    /** 吃鱼成功 +1 */
    onFishCaught: function () {
        this.count++;
        if (this.count > this.maxCombo) this.maxCombo = this.count;
        this.updateHUD();

        // 加分已在 addScore 中通过 getComboBonus() 获取
        // 检测里程碑
        if (this.count >= 20 && !this._triggeredMilestones[20]) {
            this._triggeredMilestones[20] = true;
            // 仅弹出 meme 图，不显示原有文字效果（保留音效）
            this.showPopup('', 'unbelievable');
            GameSounds.playCombo('unbelievable');
        } else if (this.count >= 10 && !this._triggeredMilestones[10]) {
            this._triggeredMilestones[10] = true;
            this.showPopup('', 'great');
            GameSounds.playCombo('great');
        } else if (this.count >= 5 && !this._triggeredMilestones[5]) {
            this._triggeredMilestones[5] = true;
            this.showPopup('', 'good');
            GameSounds.playCombo('good');
        }
    },

    /** 碰到障碍物清零 */
    reset: function () {
        this.count = 0;
        this.hideCombo();
    },

    /**
     * 获取当前连击额外加分
     * @returns {number}
     */
    getComboBonus: function () {
        return this.count * 2;
    },

    /** 更新 HUD 连击显示 */
    updateHUD: function () {
        var el = document.getElementById('hudCombo');
        if (!el) return;
        if (this.count >= 2) {
            el.style.display = 'inline-block';
            el.textContent = '🔥 x' + this.count;
            // 触发动画
            el.classList.remove('hud-combo');
            void el.offsetWidth;
            el.classList.add('hud-combo');
        } else {
            this.hideCombo();
        }
    },

    /** 隐藏连击显示 */
    hideCombo: function () {
        var el = document.getElementById('hudCombo');
        if (el) el.style.display = 'none';
    },

    /**
     * 屏幕中央弹字动画
     * @param {string} text - 显示文字
     * @param {string} cls - CSS类名
     */
    showPopup: function (text, cls) {
        var el = document.getElementById('comboPopup');
        if (!el) return;

        // 使用 DOM API 创建元素，便于绑定 onerror 做容错
        var memeIndex = Math.floor(Math.random() * ASSET_PATHS.images.comboMemes.length);
        var memeSrc = ASSET_PATHS.images.comboMemes[memeIndex] || '';
        el.innerHTML = '';
        var wrap = document.createElement('div');
        wrap.className = 'combo-meme-wrap';

        var img = document.createElement('img');
        img.className = 'combo-meme-img';
        img.src = memeSrc;
        img.alt = text;
        // 加载失败处理：隐藏图片但保留文字
        img.onerror = function () { img.style.display = 'none'; };

        wrap.appendChild(img);
        // 仅在有文字时插入文字节点（按需求可禁用里程碑文字）
        if (text) {
            var span = document.createElement('span');
            span.className = 'combo-popup-text';
            span.textContent = text;
            wrap.appendChild(span);
        }
        el.appendChild(wrap);

            el.className = 'combo-popup ' + cls;
            el.style.display = 'flex';
            // 确保居中显示并设置图片尺寸在 250-300px（若图片本身更大，CSS max-width 限制生效）
            var imgEl = el.querySelector('.combo-meme-img');
            if (imgEl) {
                var w = 250 + Math.floor(Math.random() * 51); // 250-300
                imgEl.style.width = w + 'px';
            }

        if (Settings.data.soundEnabled && ASSET_PATHS.audio.comboMeow) {
            try {
                var meow = new Audio(ASSET_PATHS.audio.comboMeow);
                meow.volume = 0.45;
                meow.play().catch(function () {});
            } catch (e) {
                console.warn('Combo 音效播放失败：', e);
            }
        }

        var self = this;
        clearTimeout(this._popupTimeout);
        this._popupTimeout = setTimeout(function () {
            if (el) {
                el.style.opacity = '0';
                setTimeout(function () { if (el) el.style.display = 'none'; el.style.opacity = ''; }, 350);
            }
        }, 2000);
    },

    /** 清除弹字定时器并清空所有表情包DOM */
    clearPopup: function () {
        clearTimeout(this._popupTimeout);
        var el = document.getElementById('comboPopup');
        if (el) {
            el.style.display = 'none';
            el.innerHTML = ''; // 清空所有表情包DOM
            el.style.opacity = '';
            el.style.top = '';      // 重置随机位置
            el.style.left = '';
            el.style.transform = '';
            el.className = 'combo-popup';
        }
    },
};

/* ==================== 烟花系统 ==================== */
/**
 * 【新增】FireworkSystem
 * 单局得分 ≥ 500 分时在结算页触发全屏烟花
 */
const FireworkSystem = {
    /** 烟花粒子定时器 */
    _timers: [],

    /**
     * 播放烟花（持续 4 秒）
     */
    play: function () {
        var layer = document.getElementById('fireworksLayer');
        if (!layer) return;
        layer.style.display = 'block';
        layer.innerHTML = '';

        var self = this;
        var colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C084FC', '#FF8C00', '#00E5FF'];

        function launchFirework() {
            if (!layer || layer.style.display === 'none') return;
            var x = 15 + Math.random() * 70; // 水平位置百分比
            var y = 20 + Math.random() * 40; // 垂直位置百分比
            var color = colors[Math.floor(Math.random() * colors.length)];
            var count = 20 + Math.floor(Math.random() * 20); // 粒子数

            for (var i = 0; i < count; i++) {
                var particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.left = x + '%';
                particle.style.top = y + '%';
                particle.style.background = color;
                particle.style.boxShadow = '0 0 6px ' + color;
                var angle = (Math.PI * 2 * i) / count;
                var dist = 40 + Math.random() * 80;
                particle.style.setProperty('--fx', Math.cos(angle) * dist + 'px');
                particle.style.setProperty('--fy', Math.sin(angle) * dist + 'px');
                layer.appendChild(particle);
            }
        }

        // 立即发射一波，然后每隔一定间隔发射
        for (var j = 0; j < 5; j++) {
            self._timers.push(setTimeout(function () { launchFirework(); }, j * 80));
        }
        // 持续发射
        var burstInterval = setInterval(function () { launchFirework(); }, 600);
        self._timers.push(burstInterval);
        // 4秒后停止
        self._timers.push(setTimeout(function () { self.stop(); }, 4000));
    },

    /**
     * 停止烟花
     */
    stop: function () {
        this._timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
        this._timers = [];
        var layer = document.getElementById('fireworksLayer');
        if (layer) {
            layer.style.display = 'none';
            layer.innerHTML = '';
        }
    },
};

/* ==================== 页面管理器（SPA 导航） ==================== */
/**
 * 管理三个页面容器之间的切换，使用 .active class 控制显示/隐藏。
 * 不刷新页面，实现单页应用（SPA）导航。
 */
const PageManager = {
    /** 当前显示的页面 ID */
    currentPage: 'pageHome',

    /** 所有页面 ID 列表 */
    pageIds: ['pageHome', 'pageDifficulty', 'pageGame'],

    /**
     * 切换到指定页面
     * @param {string} pageId - 目标页面容器 ID
     */
    navigateTo: function (pageId) {
        // 隐藏所有页面
        this.pageIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
            }
        });

        // 显示目标页面
        var target = document.getElementById(pageId);
        if (target) {
            target.classList.add('active');
            this.currentPage = pageId;
        }
    },

    /** 返回首页 */
    goHome: function () {
        // 如果之前在游戏中，确保游戏已停止
        if (GameEngine.isRunning) {
            GameEngine.stop();
        }
        // 清除所有首页彩蛋残留
        HomeEasterEggManager.clearAll();
        this.navigateTo('pageHome');
        // 恢复背景装饰
        BubbleGenerator.start();
        FishGenerator.start();
        // 恢复页面滚动
        document.body.style.overflow = '';
    },

    /** 前往难度选择页 */
    goDifficulty: function () {
        // 如果之前在游戏中，确保游戏已停止
        if (GameEngine.isRunning) {
            GameEngine.stop();
        }
        this.navigateTo('pageDifficulty');
        // 恢复背景装饰
        BubbleGenerator.start();
        FishGenerator.start();
        // 恢复页面滚动
        document.body.style.overflow = '';
    },

    /** 前往游戏页面 */
    goGame: function () {
        this.navigateTo('pageGame');
        // 暂停背景装饰（保持游戏区域干净）
        BubbleGenerator.stop();
        FishGenerator.stop();
    },
};

/* ==================== 游戏引擎 ==================== */
/**
 * 游戏核心引擎
 * 使用 requestAnimationFrame + delta time 驱动的游戏循环。
 * 管理：玩家移动、掉落物品、碰撞检测、得分/生命、游戏结束。
 */
const GameEngine = {
    // ---- 游戏状态 ----
    isRunning: false,
    isPaused: false,
    isInitializing: false,
    difficulty: null,          // 'easy' | 'normal' | 'hard' | 'timed'
    config: null,
    score: 0,
    lives: 3,
    isTimedMode: false,        // 【新增】限时挑战模式标记

    // ---- 玩家位置 ----
    playerX: 50,

    // ---- 游戏循环 ----
    animFrameId: null,
    lastTimestamp: 0,

    // ---- 物品管理 ----
    items: [],

    // ---- 生成定时器 ----
    fishSpawnIntervalId: null,
    obstacleSpawnIntervalId: null,
    // 【新增】限时模式倒计时定时器
    timedCountdownId: null,

    // 【新增】道具生成计数器
    powerupSpawnCounter: 0,

    // ---- 按键状态 ----
    keysPressed: {},

    // ---- 触摸/鼠标状态 ----
    touchActive: false,

    // ---- 暂停遮罩 DOM 引用 ----
    pauseOverlayEl: null,

    // ---- 绑定的处理函数引用 ----
    _onKeyDown: null,
    _onKeyUp: null,
    _onTouchStart: null,
    _onTouchMove: null,
    _onTouchEnd: null,

    /**
     * 初始化并启动游戏
     * @param {string} difficulty - 难度标识 'easy' | 'normal' | 'hard' | 'timed'
     */
    init: function (difficulty) {
        var self = this;

        if (this.isInitializing) {
            console.warn('游戏正在初始化中，忽略重复调用');
            return;
        }
        if (this.isRunning && !this.isPaused) {
            this.stop();
        }

        this.isInitializing = true;

        // 1. 设置难度配置
        this.difficulty = difficulty;
        this.isTimedMode = (difficulty === 'timed'); // 【新增】检测限时模式
        if (this.isTimedMode) {
            // 限时模式使用一般难度的速度参数
            this.config = Object.assign({}, DIFFICULTY_CONFIG.normal);
            this.config.label = '限时挑战';
            this.config.lives = 3; // 限时挑战初始生命为3
        } else {
            this.config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
        }

        // 2. 重置状态
        this.score = 0;
        this.lives = this.config.lives;
        this.playerX = 50;
        this.items = [];
        this.keysPressed = {};
        this.touchActive = false;
        this.isPaused = false;

        // 重置道具系统
        this.powerupSpawnCounter = 0;
        PowerUpManager.init();

        // 【新增】重置连击系统
        ComboSystem.init();
        // 【新增】应用当前皮肤
        SkinManager.applySkin();

        // 3. 更新 HUD
        this.updateHUD();
        this.updatePauseButton();

        // 4. 清空游戏区域
        this.clearGameArea();

        // 5. 绑定输入事件
        this.bindInputEvents();

        // 6. 显示/隐藏限时模式HUD
        var timerEl = document.getElementById('hudTimer');
        var livesEl = document.getElementById('hudLives');
        if (this.isTimedMode) {
            if (timerEl) timerEl.style.display = 'inline-block';
            if (livesEl) livesEl.style.display = ''; // 限时模式显示生命值（3条）
        } else {
            if (timerEl) timerEl.style.display = 'none';
            if (livesEl) livesEl.style.display = '';
        }

        // 7. 延迟启动游戏循环
        this.isRunning = true;
        this.lastTimestamp = 0;
        setTimeout(function () {
            self.isInitializing = false;
            self.startGameLoop();
        }, 100);

        // 8. 启动物品生成器
        this.startSpawners();

        // 【新增】限时模式：启动60秒倒计时
        if (this.isTimedMode) {
            this.startTimedCountdown();
        }
    },

    /**
     * 启动物品生成计时器
     */
    startSpawners: function () {
        var self = this;
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        // ---- 小鱼生成器 ----
        this.fishSpawnIntervalId = setInterval(function () {
            if (!self.isRunning || self.isPaused) return; // 【优化】暂停时不生成
            self.spawnItem('fish');
        }, this.config.fishInterval);

        // ---- 障碍物生成器 ----
        this.obstacleSpawnIntervalId = setInterval(function () {
            if (!self.isRunning || self.isPaused) return; // 【优化】暂停时不生成
            self.spawnItem('obstacle');
        }, this.config.obstacleInterval);
    },

    /**
     * 停止物品生成器
     */
    stopSpawners: function () {
        if (this.fishSpawnIntervalId) {
            clearInterval(this.fishSpawnIntervalId);
            this.fishSpawnIntervalId = null;
        }
        if (this.obstacleSpawnIntervalId) {
            clearInterval(this.obstacleSpawnIntervalId);
            this.obstacleSpawnIntervalId = null;
        }
    },

    /**
     * 【新增】启动限时模式60秒倒计时
     */
    startTimedCountdown: function () {
        var self = this;
        var remainingSeconds = 60; // 60秒固定时长

        function tick() {
            if (!self.isRunning || self.isPaused) {
                // 暂停时重新调度，一秒后再检查
                self.timedCountdownId = setTimeout(tick, 1000);
                return;
            }
            remainingSeconds--;
            // 更新 HUD
            var timerEl = document.getElementById('hudTimer');
            if (timerEl) {
                timerEl.textContent = '⏱️ ' + remainingSeconds + 's';
                if (remainingSeconds <= 10) {
                    timerEl.classList.add('urgent');
                } else {
                    timerEl.classList.remove('urgent');
                }
            }
            if (remainingSeconds <= 0) {
                // 时间到，强制结束
                self.timedCountdownId = null;
                self.gameOver();
                return;
            }
            self.timedCountdownId = setTimeout(tick, 1000);
        }

        this.timedCountdownId = setTimeout(tick, 1000);
    },

    /**
     * 【新增】停止限时倒计时
     */
    stopTimedCountdown: function () {
        if (this.timedCountdownId) {
            clearTimeout(this.timedCountdownId);
            this.timedCountdownId = null;
        }
        var timerEl = document.getElementById('hudTimer');
        if (timerEl) {
            timerEl.style.display = 'none';
            timerEl.classList.remove('urgent');
        }
    },

    /**
     * 【优化】生成一个掉落物品
     * 支持多种小鱼（大小不同分值不同）、多种障碍物（石头/炸弹/贝壳）
     * @param {string} type - 'fish' 或 'obstacle'
     */
    spawnItem: function (type) {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl || !this.isRunning || this.isPaused) return;

        // 【优化】限制最大物品数量，防止元素过多导致页面卡顿
        if (this.items.length >= this.config.maxItems) return;

        // 创建物品 DOM 元素
        var itemEl = document.createElement('span');

        var bonusScore = 0;
        var itemSize = 'medium';

        if (type === 'fish') {
            // 加权随机选择鱼种类（统一使用 baseScore）
            var totalWeight = 0;
            FISH_TYPES.forEach(function (f) { totalWeight += f.weight; });
            var rand = Math.random() * totalWeight;
            var cumulative = 0;
            var chosenFish = FISH_TYPES[0];
            for (var fi = 0; fi < FISH_TYPES.length; fi++) {
                cumulative += FISH_TYPES[fi].weight;
                if (rand <= cumulative) {
                    chosenFish = FISH_TYPES[fi];
                    break;
                }
            }

            itemEl.textContent = chosenFish.emoji;
            itemSize = chosenFish.size;
            // 使用统一基础分
            var baseScore = chosenFish.baseScore || 1;

            // 大号鱼添加特殊样式
            if (chosenFish.size === 'large') {
                itemEl.className = 'game-item fish-type fish-large';
            } else {
                itemEl.className = 'game-item fish-type';
            }

            // 保存运行时分值
            itemEl.dataset.baseScore = baseScore;
        } else {
            // 【优化】根据难度选择障碍物类型
            var obstacleList = this.config.obstacleTypes || ['🪨', '💣'];
            itemEl.textContent = obstacleList[Math.floor(Math.random() * obstacleList.length)];
            itemEl.className = 'game-item obstacle-type';
        }

        // 随机水平位置（10% ~ 88%，避免贴边）
        var xPercent = 10 + Math.random() * 78;

        // 定位物品在游戏区域顶部上方
        itemEl.style.left = xPercent + '%';
        itemEl.style.top = '-50px';

        // 添加到游戏区域
        gameAreaEl.appendChild(itemEl);

        // 【优化】计算速度：困难模式有概率生成高速鱼
        var speed = this.config.fishSpeed;
        if (type === 'fish' && this.config.fastFishChance > 0 && Math.random() < this.config.fastFishChance) {
            speed = speed * 1.6; // 高速鱼比普通鱼快 60%
        }

        // 记录物品数据
        this.items.push({
            el: itemEl,
            type: type,
            speed: speed,
            xPercent: xPercent,
            size: itemSize,
            baseScore: (itemEl.dataset && itemEl.dataset.baseScore) ? parseInt(itemEl.dataset.baseScore, 10) : (this.config.scorePerFish || 1),
        });

        // 【新增】道具生成计数器：每 spawnEveryN 个普通物品后触发道具掉落
        this.powerupSpawnCounter++;
        if (type !== 'powerup' && this.powerupSpawnCounter >= POWERUP_SPAWN_CONFIG.spawnEveryN) {
            this.powerupSpawnCounter = 0;
            this.trySpawnPowerup();
        }
    },

    /**
     * 【新增】尝试生成随机道具
     * 受概率、屏幕上已有道具数量限制
     */
    trySpawnPowerup: function () {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl || !this.isRunning || this.isPaused) return;

        // 概率检查
        if (Math.random() > POWERUP_SPAWN_CONFIG.spawnChance) return;

        // 屏幕上道具数量限制
        var powerupCount = 0;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].type === 'powerup') powerupCount++;
        }
        if (powerupCount >= POWERUP_SPAWN_CONFIG.maxOnScreen) return;

        // 随机选择一个道具（优先产生普通道具，部分概率产生恶魔道具）
        var config;
        if (Math.random() < EVIL_PROP_SPAWN_CHANCE) {
            config = EVIL_PROP_CONFIG;
        } else {
            config = POWERUP_CONFIG[Math.floor(Math.random() * POWERUP_CONFIG.length)];
        }

        var itemEl = document.createElement('span');
        itemEl.className = 'game-item powerup-type';
        itemEl.textContent = config.emoji;

        // 随机水平位置
        var xPercent = 15 + Math.random() * 70;
        itemEl.style.left = xPercent + '%';
        itemEl.style.top = '-50px';

        gameAreaEl.appendChild(itemEl);

        this.items.push({
            el: itemEl,
            type: 'powerup',
            speed: this.config.fishSpeed * 0.8, // 道具下落速度稍慢于鱼
            xPercent: xPercent,
            size: 'medium',
            bonusScore: 0,
            powerupId: config.id,
        });
    },

    /**
     * 启动游戏循环
     */
    startGameLoop: function () {
        var self = this;
        this.lastTimestamp = 0;

        /**
         * 游戏主循环（每帧调用）
         * @param {number} timestamp - requestAnimationFrame 的时间戳
         */
        function loop(timestamp) {
            if (!self.isRunning) return;

            // 【优化】暂停时不更新游戏逻辑，但保持循环运行
            if (self.isPaused) {
                self.lastTimestamp = timestamp; // 更新时间戳防止恢复后大跳跃
                self.animFrameId = requestAnimationFrame(loop);
                return;
            }

            // 计算 delta time（秒），上限 0.1s 防止标签切换后大跳跃
            if (!self.lastTimestamp) self.lastTimestamp = timestamp;
            var deltaTime = Math.min((timestamp - self.lastTimestamp) / 1000, 0.1);
            self.lastTimestamp = timestamp;

            // 帧率归一化系数（以 60fps 为基准）
            var fpsScale = deltaTime * 60;

            // 1. 更新玩家位置
            self.updatePlayerPosition(fpsScale);

            // 2. 更新所有物品位置
            self.updateItems(fpsScale);

            // 3. 碰撞检测
            self.checkCollisions();

            // 4. 清理越界物品
            self.cleanupOutOfBoundsItems();

            // 【新增】更新道具状态指示器（每秒刷新一次倒计时）
            if (PowerUpManager.activeEffect) {
                PowerUpManager.updateIndicator();
            }

            // 5. 继续循环
            self.animFrameId = requestAnimationFrame(loop);
        }

        this.animFrameId = requestAnimationFrame(loop);
    },

    /**
     * 根据当前输入状态更新玩家小猫的水平位置
     * @param {number} fpsScale - 帧率缩放系数
     */
    updatePlayerPosition: function (fpsScale) {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        var areaWidth = gameAreaEl.clientWidth;
        var playerEl = document.getElementById('gamePlayer');
        if (!playerEl) return;

        var playerWidth = playerEl.offsetWidth || 50;

        // 键盘移动速度：每帧移动约 1.2% 的游戏区域宽度
        // 【新增】减速惩罚时速度降低
        var moveStep = 1.2 * fpsScale * PowerUpManager.getPlayerSpeedMultiplier();

        if (this.keysPressed['ArrowLeft'] || this.keysPressed['a'] || this.keysPressed['A']) {
            this.playerX -= moveStep;
        }
        if (this.keysPressed['ArrowRight'] || this.keysPressed['d'] || this.keysPressed['D']) {
            this.playerX += moveStep;
        }

        // 限制在游戏区域内（以百分比计，考虑小猫宽度）
        var playerWidthPercent = (playerWidth / areaWidth) * 100;
        this.playerX = Math.max(playerWidthPercent / 2, Math.min(100 - playerWidthPercent / 2, this.playerX));

        // 更新 DOM 位置
        playerEl.style.left = this.playerX + '%';
    },

    /**
     * 更新所有掉落物品的位置
     * @param {number} fpsScale - 帧率缩放系数
     */
    updateItems: function (fpsScale) {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            // 每帧下移 speed 像素（乘以 fpsScale 保持帧率无关）
            var currentTop = parseFloat(item.el.style.top) || -40;
            var newTop = currentTop + item.speed * fpsScale;
            item.el.style.top = newTop + 'px';
        }
    },

    /**
     * 碰撞检测：检查玩家与所有物品的重叠
     */
    checkCollisions: function () {
        var playerEl = document.getElementById('gamePlayer');
        if (!playerEl) return;

        var playerRect = playerEl.getBoundingClientRect();

        // 缩小碰撞箱 20%，更宽容（让玩家感觉更公平）
        var shrinkX = playerRect.width * 0.15;
        var shrinkY = playerRect.height * 0.15;
        var pLeft = playerRect.left + shrinkX;
        var pRight = playerRect.right - shrinkX;
        var pTop = playerRect.top + shrinkY;
        var pBottom = playerRect.bottom - shrinkY;

        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            var itemRect = item.el.getBoundingClientRect();

            // 物品碰撞箱也缩小一点
            var iShrinkX = itemRect.width * 0.2;
            var iShrinkY = itemRect.height * 0.2;
            var iLeft = itemRect.left + iShrinkX;
            var iRight = itemRect.right - iShrinkX;
            var iTop = itemRect.top + iShrinkY;
            var iBottom = itemRect.bottom - iShrinkY;

            // 矩形重叠检测
            var overlap = !(pRight < iLeft || pLeft > iRight || pBottom < iTop || pTop > iBottom);

            if (overlap) {
                // 【新增】道具拾取
                if (item.type === 'powerup') {
                    PowerUpManager.activate(item.powerupId);
                    this.removeItem(i);
                    continue;
                }
                if (item.type === 'fish') {
                    // 接到小鱼：使用物品的 baseScore，受双倍道具倍率影响，连击额外加分另算
                    var base = (typeof item.baseScore === 'number') ? item.baseScore : (this.config.scorePerFish || 1);
                    var totalPoints = base * PowerUpManager.getScoreMultiplier();
                    this.addScore(totalPoints, item);
                    this.removeItem(i);
                } else if (item.type === 'obstacle') {
                    // 碰到障碍物：扣命
                    this.loseLife();
                    this.removeItem(i);
                    // 检查游戏是否结束
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    },

    /**
     * 移除指定索引的物品
     * @param {number} index - 物品在 items 数组中的索引
     */
    removeItem: function (index) {
        if (index < 0 || index >= this.items.length) return;
        var item = this.items[index];
        // 从 DOM 中移除
        if (item.el && item.el.parentNode) {
            item.el.parentNode.removeChild(item.el);
        }
        // 从数组中移除
        this.items.splice(index, 1);
    },

    /**
     * 加分并显示浮动文字
     * @param {number} points - 加分值
     * @param {Object} item - 被收集的物品对象
     */
    addScore: function (points, item) {
        // 连击计数+1（仅触发表情包弹窗，不影响分数）
        ComboSystem.onFishCaught();

        // 仅使用鱼类基础分+道具倍率，不叠加连击额外分
        this.score += points;
        this.updateHUD();

        // 播放接鱼音效
        GameSounds.playCatch();

        // 【优化】分数跳动动画
        var hudScoreEl = document.getElementById('hudScore');
        if (hudScoreEl) {
            hudScoreEl.classList.remove('bounce');
            void hudScoreEl.offsetWidth; // 强制回流
            hudScoreEl.classList.add('bounce');
        }

        // 【优化】小猫吃到鱼开心抖动
        var playerEl = document.getElementById('gamePlayer');
        if (playerEl) {
            playerEl.classList.remove('catch-dance');
            void playerEl.offsetWidth;
            playerEl.classList.add('catch-dance');
        }

        // 显示浮动 "+N" 文字
        if (item && item.el) {
            var itemRect = item.el.getBoundingClientRect();
            var gameAreaEl = document.getElementById('gameArea');
            if (gameAreaEl) {
                var areaRect = gameAreaEl.getBoundingClientRect();
                var floatX = itemRect.left - areaRect.left + itemRect.width / 2;
                var floatY = itemRect.top - areaRect.top;

                var floatEl = document.createElement('span');
                floatEl.className = 'floating-text';
                // 【新增】双倍分数时浮动文字更大更闪
                var isDouble = PowerUpManager.getScoreMultiplier() > 1;
                if (isDouble) {
                    floatEl.classList.add('double-score');
                    floatEl.textContent = '+' + points + ' x2';
                } else if (item.bonusScore && item.bonusScore > 0) {
                    floatEl.textContent = '+' + points + ' 🎉';
                    floatEl.style.fontSize = '1.3rem';
                    floatEl.style.color = '#FFD700';
                } else {
                    floatEl.textContent = '+' + points;
                }
                floatEl.style.left = floatX + 'px';
                floatEl.style.top = floatY + 'px';
                gameAreaEl.appendChild(floatEl);

                // 动画结束后自动移除
                setTimeout(function () {
                    if (floatEl.parentNode) {
                        floatEl.parentNode.removeChild(floatEl);
                    }
                }, 850);
            }
        }
    },

    /**
     * 扣除一条生命，触发受伤效果
     */
    loseLife: function () {
        // 护盾生效时免疫伤害
        if (PowerUpManager.isShieldActive()) {
            return;
        }

        this.lives--;
        // 【新增】碰到障碍物重置连击
        ComboSystem.reset();
        this.updateHUD();

        // 播放受伤音效
        GameSounds.playHit();

        // 【优化】小猫受伤闪烁动画
        var playerEl = document.getElementById('gamePlayer');
        if (playerEl) {
            playerEl.classList.remove('hurt-flash');
            void playerEl.offsetWidth;
            playerEl.classList.add('hurt-flash');
        }

        // 屏幕红色闪烁
        var gameAreaEl = document.getElementById('gameArea');
        if (gameAreaEl) {
            var flash = document.createElement('div');
            flash.className = 'screen-flash';
            gameAreaEl.appendChild(flash);

            // 动画结束后自动移除
            setTimeout(function () {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 400);
        }
    },

    /**
     * 【优化】切换暂停/恢复
     */
    togglePause: function () {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            ComboSystem.clearPopup();
        }

        if (this.isPaused) {
            // 暂停：停止生成器、降低 BGM、冻结道具计时
            this.stopSpawners();
            BGMPlayer.lowerVolume();
            PowerUpManager.pause();
            this.showPauseOverlay();
        } else {
            // 恢复：重启生成器、恢复 BGM、恢复道具计时、重置时间戳
            this.hidePauseOverlay();
            BGMPlayer.restoreVolume();
            PowerUpManager.resume();
            this.startSpawners();
            this.lastTimestamp = 0;
        }

        this.updatePauseButton();
    },

    /**
     * 【优化】更新暂停按钮外观
     */
    updatePauseButton: function () {
        var btnPause = document.getElementById('btnPause');
        if (!btnPause) return;
        if (this.isPaused) {
            btnPause.textContent = '▶️';
            btnPause.classList.add('paused-state');
        } else {
            btnPause.textContent = '⏸️';
            btnPause.classList.remove('paused-state');
        }
    },

    /**
     * 【优化】显示暂停遮罩
     */
    showPauseOverlay: function () {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;
        // 避免重复创建
        if (this.pauseOverlayEl) return;

        var overlay = document.createElement('div');
        overlay.className = 'pause-overlay';
        overlay.innerHTML = '<span class="pause-text">⏸️ 已暂停</span>';

        // 点击遮罩也可恢复
        var self = this;
        overlay.addEventListener('click', function () {
            self.togglePause();
        });

        gameAreaEl.appendChild(overlay);
        this.pauseOverlayEl = overlay;
    },

    /**
     * 【优化】隐藏暂停遮罩
     */
    hidePauseOverlay: function () {
        if (this.pauseOverlayEl && this.pauseOverlayEl.parentNode) {
            this.pauseOverlayEl.parentNode.removeChild(this.pauseOverlayEl);
        }
        this.pauseOverlayEl = null;
    },

    /**
     * 【优化】游戏结束：停止循环、保存分难度分数、显示结算弹窗
     */
    gameOver: function () {
        this.isRunning = false;
        this.stopSpawners();
        this.stopTimedCountdown(); // 【新增】清除倒计时

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        this.unbindInputEvents();
        this.hidePauseOverlay();

        // 播放结束音效
        GameSounds.playGameOver();
        PowerUpManager.clearAllEffects();
        ComboSystem.clearPopup(); // 【新增】清除连击弹字

        BGMPlayer.lowerVolume();

        // 保存分难度最高分
        var diffKey = this.isTimedMode ? 'timed' : this.difficulty;
        var isNewRecord = Leaderboard.saveScore(diffKey, this.score);
        var currentHighScore = Leaderboard.getHighScore(diffKey);

        // 【新增】累计总分 + 检测皮肤解锁
        var newSkins = SkinManager.addScore(this.score);

        // 填充结算弹窗
        document.getElementById('goScore').textContent = this.score;
        document.getElementById('goHighScore').textContent = currentHighScore;
        document.getElementById('goDifficulty').textContent = this.config.label + (this.isTimedMode ? '' : '模式');

        // 【新增】填充连击统计
        var maxComboEl = document.getElementById('goMaxCombo');
        if (maxComboEl) maxComboEl.textContent = ComboSystem.maxCombo;

        // 填充道具拾取统计
        this.populatePowerupStats();

        // 【新增】高分庆祝
        var celebrateEl = document.getElementById('goHighscoreCelebrate');
        if (this.score >= 500) {
            if (celebrateEl) celebrateEl.style.display = 'block';
            FireworkSystem.play(); // 烟花！
        } else {
            if (celebrateEl) celebrateEl.style.display = 'none';
        }

        // 新纪录 + 新皮肤通知整合到标题
        var badgeEl = document.getElementById('newRecordBadge');
        var titleEl = document.getElementById('goTitle');
        var msg = '🎮 游戏结束';
        if (isNewRecord && this.score > 0) {
            msg = '🎉 新纪录！';
            if (badgeEl) badgeEl.style.display = 'flex';
        }
        if (newSkins && newSkins.length > 0) {
            msg += ' 🐱 解锁新皮肤：' + newSkins.join('、');
        }
        if (titleEl) titleEl.textContent = msg;
        if (!isNewRecord || this.score <= 0) {
            if (badgeEl) badgeEl.style.display = 'none';
        }

        var self = this;
        setTimeout(function () {
            ModalManager.open('modalGameOver');
        }, 400);
    },

    /**
     * 【新增】填充结算弹窗的道具拾取统计
     */
    populatePowerupStats: function () {
        var stats = PowerUpManager.getStats();
        var totalPickups = PowerUpManager.getTotalPickups();
        var totalEl = document.getElementById('goPowerupTotal');
        var gridEl = document.getElementById('powerupStatsGrid');

        if (totalEl) totalEl.textContent = totalPickups;
        if (!gridEl) return;

        // 构建统计徽章
        var html = '';
        for (var i = 0; i < POWERUP_CONFIG.length; i++) {
            var p = POWERUP_CONFIG[i];
            var count = stats[p.id] || 0;
            if (count > 0) {
                html += '<span class="powerup-stat-badge" title="' + p.name + '：' + p.desc + '">';
                html += '<span class="ps-emoji">' + p.emoji + '</span>';
                html += '<span class="ps-count">×' + count + '</span>';
                html += '</span>';
            }
        }
        // 如果没有任何道具被拾取
        if (!html) {
            html = '<span style="font-size:0.8rem;color:#8B6A4A;opacity:0.7;">本局未拾取任何道具 🎁</span>';
        }
        gridEl.innerHTML = html;
    },

    /**
     * 更新 HUD 显示（生命、分数、难度标签）
     */
    updateHUD: function () {
        if (!this.config) return;
        // 生命值
        var livesStr = '';
        if (!this.isTimedMode) {
            for (var i = 0; i < this.lives; i++) { livesStr += '❤️'; }
            for (var j = this.lives; j < (this.config.lives <= 3 ? this.config.lives : 3); j++) { livesStr += '🤍'; }
        }
        var hudLivesEl = document.getElementById('hudLives');
        if (hudLivesEl) hudLivesEl.textContent = livesStr || (this.isTimedMode ? '⏱️' : '💔');

        // 限时模式：左上角显示文本型剩余生命（实时数字）
        var hudLivesTextEl = document.getElementById('hudLivesText');
        if (hudLivesTextEl) {
            if (this.isTimedMode) {
                hudLivesTextEl.style.display = 'block';
                hudLivesTextEl.textContent = '剩余生命：' + this.lives;
                // 生命告警（<=1）时变红
                if (this.lives <= 1) {
                    hudLivesTextEl.classList.add('warning');
                } else {
                    hudLivesTextEl.classList.remove('warning');
                }
            } else {
                hudLivesTextEl.style.display = 'none';
            }
        }

        // 分数
        var hudScoreEl = document.getElementById('hudScore');
        if (hudScoreEl) hudScoreEl.textContent = '🏆 ' + this.score;

        // 难度标签
        var hudDiffEl = document.getElementById('hudDifficulty');
        if (hudDiffEl) hudDiffEl.textContent = this.config.label;
    },

    /**
     * 清理越界物品（超出游戏区域底部）
     */
    cleanupOutOfBoundsItems: function () {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        var areaHeight = gameAreaEl.clientHeight;

        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            var currentTop = parseFloat(item.el.style.top) || 0;
            // 物品完全超出底部（多留 50px 缓冲）
            if (currentTop > areaHeight + 50) {
                this.removeItem(i);
            }
        }
    },

    /**
     * 清空游戏区域内所有掉落物品和特效
     */
    clearGameArea: function () {
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        // 移除所有游戏物品
        var items = gameAreaEl.querySelectorAll('.game-item');
        items.forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        // 移除所有浮动文字
        var floats = gameAreaEl.querySelectorAll('.floating-text');
        floats.forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        // 移除所有闪屏
        var flashes = gameAreaEl.querySelectorAll('.screen-flash');
        flashes.forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        // 【新增】移除提示文字和广播
        var broadcasts = gameAreaEl.querySelectorAll('.game-broadcast, .game-toast');
        broadcasts.forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        this.items = [];
    },

    /**
     * 停止游戏（清理所有资源）
     */
    stop: function () {
        this.isRunning = false;
        this.isPaused = false;
        this.isInitializing = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        this.stopSpawners();
        this.stopTimedCountdown(); // 【新增】
        this.unbindInputEvents();

        PowerUpManager.clearAllEffects();
        ComboSystem.init(); // 【新增】重置连击
        ComboSystem.clearPopup(); // 清除所有连击表情包DOM
        FireworkSystem.stop(); // 【新增】停止烟花
        this.clearGameArea();
        this.hidePauseOverlay();
        BGMPlayer.restoreVolume();

        // 恢复 HUD
        var livesEl = document.getElementById('hudLives');
        if (livesEl) livesEl.style.display = '';
    },

    /* ==================== 输入事件绑定/解绑 ==================== */

    /**
     * 绑定键盘和触摸输入事件
     */
    bindInputEvents: function () {
        var self = this;

        // 键盘按下
        this._onKeyDown = function (event) {
            self.keysPressed[event.key] = true;

            // 【优化】P 键暂停/恢复
            if (event.key === 'p' || event.key === 'P') {
                self.togglePause();
                event.preventDefault();
                return;
            }

            // 防止方向键滚动页面
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
                event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
            }
        };
        document.addEventListener('keydown', this._onKeyDown);

        // 键盘松开
        this._onKeyUp = function (event) {
            self.keysPressed[event.key] = false;
        };
        document.addEventListener('keyup', this._onKeyUp);

        // ---- 触摸事件（手机滑动控制） ----
        var gameAreaEl = document.getElementById('gameArea');
        if (!gameAreaEl) return;

        this._onTouchStart = function (event) {
            self.touchActive = true;
            var touch = event.touches[0];
            var areaRect = gameAreaEl.getBoundingClientRect();
            // 【新增】减速惩罚时触摸也相应减慢：通过降低响应灵敏度实现
            var playerSpeedMul = PowerUpManager.getPlayerSpeedMultiplier();
            var touchXPercent = ((touch.clientX - areaRect.left) / areaRect.width) * 100;
            // 如果减速中，手指位置和实际位置的偏移减小
            if (playerSpeedMul < 1) {
                var playerEl = document.getElementById('gamePlayer');
                var currentX = self.playerX;
                touchXPercent = currentX + (touchXPercent - currentX) * playerSpeedMul;
            }
            var playerEl = document.getElementById('gamePlayer');
            if (playerEl) {
                var playerWidthPercent = (playerEl.offsetWidth / areaRect.width) * 100;
                self.playerX = Math.max(playerWidthPercent / 2, Math.min(100 - playerWidthPercent / 2, touchXPercent));
                playerEl.style.left = self.playerX + '%';
            }
            event.preventDefault();
        };

        this._onTouchMove = function (event) {
            if (!self.touchActive) return;
            var touch = event.touches[0];
            var areaRect = gameAreaEl.getBoundingClientRect();
            var touchXPercent = ((touch.clientX - areaRect.left) / areaRect.width) * 100;
            // 【新增】减速惩罚时跟随变慢
            var playerSpeedMul = PowerUpManager.getPlayerSpeedMultiplier();
            if (playerSpeedMul < 1) {
                var currentX = self.playerX;
                touchXPercent = currentX + (touchXPercent - currentX) * playerSpeedMul;
            }
            var playerEl = document.getElementById('gamePlayer');
            if (playerEl) {
                var playerWidthPercent = (playerEl.offsetWidth / areaRect.width) * 100;
                self.playerX = Math.max(playerWidthPercent / 2, Math.min(100 - playerWidthPercent / 2, touchXPercent));
                playerEl.style.left = self.playerX + '%';
            }
            event.preventDefault();
        };

        this._onTouchEnd = function () {
            self.touchActive = false;
        };

        gameAreaEl.addEventListener('touchstart', this._onTouchStart, { passive: false });
        gameAreaEl.addEventListener('touchmove', this._onTouchMove, { passive: false });
        gameAreaEl.addEventListener('touchend', this._onTouchEnd);
    },

    /**
     * 解绑所有输入事件（游戏停止/销毁时调用）
     */
    unbindInputEvents: function () {
        if (this._onKeyDown) {
            document.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }
        if (this._onKeyUp) {
            document.removeEventListener('keyup', this._onKeyUp);
            this._onKeyUp = null;
        }

        var gameAreaEl = document.getElementById('gameArea');
        if (gameAreaEl) {
            if (this._onTouchStart) {
                gameAreaEl.removeEventListener('touchstart', this._onTouchStart);
                this._onTouchStart = null;
            }
            if (this._onTouchMove) {
                gameAreaEl.removeEventListener('touchmove', this._onTouchMove);
                this._onTouchMove = null;
            }
            if (this._onTouchEnd) {
                gameAreaEl.removeEventListener('touchend', this._onTouchEnd);
                this._onTouchEnd = null;
            }
        }
    },
};

/* ==================== 游戏音效（Web Audio API） ==================== */
/**
 * 游戏内事件音效：接到鱼、碰到障碍物、游戏结束
 * 复用 BGMPlayer 的 AudioContext 实例
 */
const GameSounds = {
    /**
     * 播放接鱼音效（短促高频"叮"声）
     */
    playCatch: function () {
        if (!Settings.data.soundEnabled) return;
        if (!BGMPlayer.audioContext) return;

        var ctx = BGMPlayer.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var sfxGain = BGMPlayer.sfxGain;

        // 高频叮声：800Hz → 1200Hz 快速上滑
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        if (sfxGain) {
            gain.connect(sfxGain);
        } else {
            gain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + 0.14);
    },

    /**
     * 播放受伤音效（低沉"咚"声）
     */
    playHit: function () {
        if (!Settings.data.soundEnabled) return;
        if (!BGMPlayer.audioContext) return;

        var ctx = BGMPlayer.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var sfxGain = BGMPlayer.sfxGain;

        // 低音咚声：200Hz → 80Hz 快速下滑
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        if (sfxGain) {
            gain.connect(sfxGain);
        } else {
            gain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + 0.2);
    },

    /**
     * 【新增】播放道具拾取音效
     * 不同道具不同音色
     * @param {string} powerupId - 道具 ID
     */
    playPowerup: function (powerupId) {
        if (!Settings.data.soundEnabled) return;
        if (!BGMPlayer.audioContext) return;

        var ctx = BGMPlayer.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var sfxGain = BGMPlayer.sfxGain;

        if (powerupId === 'heal') {
            // 治愈音效：柔和上升和弦 (C5+E5)
            [523, 659].forEach(function (f, idx) {
                var osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = f;
                var gain = ctx.createGain();
                gain.gain.setValueAtTime(0.18, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25 + idx * 0.08);
                osc.connect(gain);
                if (sfxGain) gain.connect(sfxGain); else gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + 0.3 + idx * 0.08);
            });
        } else if (powerupId === 'shield') {
            // 护盾音效：清脆金属声
            var osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
            var gain = ctx.createGain();
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.connect(gain);
            if (sfxGain) gain.connect(sfxGain); else gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (powerupId === 'crabDebuff') {
            // 负面音效：低沉下落
            var osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
            var gain = ctx.createGain();
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            if (sfxGain) gain.connect(sfxGain); else gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
        } else {
            // 默认增益音效：明亮的短琶音
            [800, 1000, 1200].forEach(function (f, idx) {
                var osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = f;
                var gain = ctx.createGain();
                gain.gain.setValueAtTime(0.15, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12 + idx * 0.05);
                osc.connect(gain);
                if (sfxGain) gain.connect(sfxGain); else gain.connect(ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + 0.15 + idx * 0.05);
            });
        }
    },

    /**
     * 【新增】播放连击里程碑音效
     * @param {string} level - 'good' | 'great' | 'unbelievable'
     */
    playCombo: function (level) {
        if (!Settings.data.soundEnabled) return;
        if (!BGMPlayer.audioContext) return;
        var ctx = BGMPlayer.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var sfxGain = BGMPlayer.sfxGain;

        if (level === 'good') {
            // 轻快的双音上扬
            [523, 659].forEach(function (f, idx) {
                var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
                var g = ctx.createGain(); g.gain.setValueAtTime(0.2, now + idx * 0.1); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + idx * 0.1);
                o.connect(g); if (sfxGain) g.connect(sfxGain); else g.connect(ctx.destination);
                o.start(now + idx * 0.1); o.stop(now + 0.35 + idx * 0.1);
            });
        } else if (level === 'great') {
            // 三音上行琶音
            [523, 659, 784].forEach(function (f, idx) {
                var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
                var g = ctx.createGain(); g.gain.setValueAtTime(0.18, now + idx * 0.08); g.gain.exponentialRampToValueAtTime(0.01, now + 0.25 + idx * 0.08);
                o.connect(g); if (sfxGain) g.connect(sfxGain); else g.connect(ctx.destination);
                o.start(now + idx * 0.08); o.stop(now + 0.3 + idx * 0.08);
            });
        } else if (level === 'unbelievable') {
            // 五音快速上行+长尾音
            [523, 587, 659, 784, 1047].forEach(function (f, idx) {
                var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
                var g = ctx.createGain(); g.gain.setValueAtTime(0.15, now + idx * 0.05); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + idx * 0.05);
                o.connect(g); if (sfxGain) g.connect(sfxGain); else g.connect(ctx.destination);
                o.start(now + idx * 0.05); o.stop(now + 0.35 + idx * 0.05);
            });
        }
    },

    /**
     * 播放游戏结束音效（下行三音阶）
     */
    playGameOver: function () {
        if (!Settings.data.soundEnabled) return;
        if (!BGMPlayer.audioContext) return;

        var ctx = BGMPlayer.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var sfxGain = BGMPlayer.sfxGain;

        // 三个下行音符：500 → 350 → 200
        var notes = [
            { freq: 500, time: 0, dur: 0.15 },
            { freq: 350, time: 0.15, dur: 0.15 },
            { freq: 200, time: 0.3, dur: 0.3 },
        ];

        notes.forEach(function (note) {
            var osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            var gain = ctx.createGain();
            var startTime = now + note.time;
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc.connect(gain);
            if (sfxGain) {
                gain.connect(sfxGain);
            } else {
                gain.connect(ctx.destination);
            }

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.02);
        });
    },
};

/* ==================== 应用初始化 ==================== */

/**
 * 主初始化函数：按顺序初始化各个模块
 */
function init() {
    // 1. 加载本地存储的设置数据
    Settings.init();

    // 2. 加载排行榜数据
    Leaderboard.init();

    // 2.25 初始化皮肤管理
    SkinManager.init();

        // 2.5. 加载音乐选择与恶魔道具统计
        MusicManager.init();
        EvilCountTracker.init();

        // 开发测试钩子：自动在页面加载时模拟一次得分以便本地验证
        // 启用方式（任选其一）：
        //   1. URL参数：在浏览器打开 index.html?dev 即可自动模拟60000分
        //   2. localStorage：在控制台执行 localStorage.setItem('catGame_dev_simulate_score', '60000') 后刷新页面
        try {
            var devSim = null;
            // 方式1：URL参数 ?dev 自动模拟60000分（解锁全部皮肤）
            if (window.location.search.indexOf('dev') !== -1) {
                devSim = 60000;
                console.log('🐱 [开发模式] 检测到 ?dev 参数，自动模拟 ' + devSim + ' 累计得分');
            }
            // 方式2：localStorage 模拟键（优先级更高，可自定义分数）
            var lsSim = parseInt(localStorage.getItem('catGame_dev_simulate_score'), 10);
            if (!isNaN(lsSim) && lsSim > 0) {
                devSim = lsSim;
                console.log('🐱 [开发模式] 检测到 localStorage 模拟键，自动模拟 ' + devSim + ' 累计得分');
                localStorage.removeItem('catGame_dev_simulate_score');
            }
            if (devSim !== null && devSim > 0) {
                SkinManager.addScore(devSim);
            }
        } catch (e) {
            // ignore
        }

    // 3. 初始化弹窗事件
    ModalManager.init();

    // 4. 绑定所有按钮事件
    bindEvents();

    // 5. 注册扩展接口
    registerExtensions();

    // 6. 启动动态气泡生成
    BubbleGenerator.start();

    // 7. 启动游动小鱼生成
    FishGenerator.start();

    // 8. 等待用户首次交互后初始化音频
    initAudioOnFirstInteraction();

    // 9. 打印欢迎信息
    console.log('🐱 猫猫吃鱼大冒险 首页已就绪！');
    console.log('💡 可通过 window.CatGame 调用扩展接口');
    console.log('📋 可用方法:', Object.keys(window.CatGame).join(', '));
}

// ---- 页面加载完成后执行初始化 ----
// 使用 DOMContentLoaded 确保 DOM 完全就绪
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // 如果脚本加载时 DOM 已经就绪，直接初始化
    init();
}
