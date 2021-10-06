// import '@bitmovin/api-sdk'
import { PlayerAPI } from 'bitmovin-player';
import { Analytics } from 'bitmovin-analytics/js/core/Analytics';
import BitmovinApi, { AnalyticsAttribute, AnalyticsCountQueryRequest, AnalyticsEqualFilter, AnalyticsInFilter, AnalyticsNotEqualFilter, AnalyticsQueryOperator, AnalyticsResponse, PlayerLicense } from '@bitmovin/api-sdk';
import { AnalyticsConfig } from 'bitmovin-analytics/js/types/AnalyticsConfig';

const CUSTOM_DATA_LIKE_FLAG = 'like';
const CUSTOM_DATA_DISLIKE_FLAG = 'dislike';
const ACTIVE_COLOR = '#42a5d1';
const INACTIVE_COLOR = '#000000';

interface LikeButton {
    button: HTMLButtonElement;
    text: HTMLSpanElement;
    icon: HTMLElement;
}

interface LikesApiResult {
    likes: number;
    dislikes: number;
}

interface LikeStatus {
    liked: boolean;
    disliked: boolean;
}

export class BitmovinPlayerLikePlugin {
    private analytics: Analytics | undefined;
    private bitmovinApi: BitmovinApi;
    private buttonLike: LikeButton;
    private buttonDislike: LikeButton;
    private likes: LikesApiResult = { dislikes: 0, likes: 0 };
    private likeStatus: LikeStatus = { liked: false, disliked: false };

    constructor(private player: PlayerAPI, private apiKey: string) {
        console.log('Creating BitmovinPlayerLikePlugin...')
        this.analytics = (this.player as any).analytics as Analytics;
        console.log(`Created BitmovinPlayerLikePlugin, analytics module was ${this.analytics == null ? 'not ' : ''}found.`)
        this.bitmovinApi = new BitmovinApi({ apiKey });

        this.buttonLike = this.createButton('bi-hand-thumbs-up-fill', 'Loading...', () => this.like());
        this.buttonDislike = this.createButton('bi-hand-thumbs-down-fill', 'Loading...', () => this.dislike());

        this.createUI();
        // Todo videochange
    }

    like() {
        if (this.likeStatus.liked) {
            return;
        }
        this.likeStatus.liked = true;
        this.analytics?.setCustomDataOnce({ customData1: CUSTOM_DATA_LIKE_FLAG })
        this.setIconStatus(this.buttonLike.icon, true);
        // this.refreshLikeStatus();
        // this.refreshText();
        this.likes.likes++;
        this.refreshTextLocal();
    }

    dislike() {
        if (this.likeStatus.disliked) {
            return;
        }
        this.likeStatus.disliked = true;
        this.analytics?.setCustomDataOnce({ customData1: CUSTOM_DATA_DISLIKE_FLAG })
        this.setIconStatus(this.buttonDislike.icon, true);
        // this.refreshLikeStatus();
        // this.refreshText();
        this.likes.dislikes++;
        this.refreshTextLocal();
    }

    private insertAfter(newNode: HTMLElement, referenceNode: HTMLElement) {
        referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
    }

    private createButton(icon: string, text: string, onClick: () => void): LikeButton {
        const button = document.createElement('button');
        button.addEventListener('click', () => onClick());

        const iconElement = document.createElement('i');
        iconElement.className = `bi ${icon}`;
        button.appendChild(iconElement);

        const textElement = document.createElement('span');
        textElement.innerHTML = text;
        button.appendChild(textElement);

        return { button, icon: iconElement, text: textElement };
    }

    private createUI() {
        const container = document.createElement('div');
        container.className = 'bmplayer-like-plugin-container';
        container.appendChild(this.buttonLike.button);
        container.appendChild(this.buttonDislike.button);
        this.insertAfter(container, this.player.getContainer());

        this.refreshLikeStatus();
        this.refreshText();
    }

    private setIconStatus(icon: HTMLElement, active: boolean) {
        icon.style.color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
    }

    private refreshLikeStatus() {
        this.retrieveLikeStatus().then(result => {
            this.likeStatus = result;
            this.setIconStatus(this.buttonLike.icon, result.liked);
            this.setIconStatus(this.buttonDislike.icon, result.disliked);
        });
    }

    private refreshText() {
        this.retrieveLikesByDistinctUserId().then((result) => {
            this.likes = result;
            this.refreshTextLocal();
        });
    }

    private refreshTextLocal() {
        this.buttonLike.text.innerHTML = `${this.likes.likes}`;
        this.buttonDislike.text.innerHTML = `${this.likes.dislikes}`;
    }

    private async queryApi(licenseKey: string, videoId: string, userId: string | null = null): Promise<LikesApiResult> {
        let filters = [
            new AnalyticsEqualFilter({ name: AnalyticsAttribute.VIDEO_ID, value: videoId }),
            new AnalyticsNotEqualFilter({ name: AnalyticsAttribute.CUSTOM_DATA_1, value: null }),
            new AnalyticsInFilter({ name: AnalyticsAttribute.CUSTOM_DATA_1, value: [CUSTOM_DATA_LIKE_FLAG, CUSTOM_DATA_DISLIKE_FLAG] }),
        ];

        if (userId != null) {
            filters = [
                ...filters,
                new AnalyticsEqualFilter({ name: AnalyticsAttribute.USER_ID, value: userId })
            ];
        }

        const request = new AnalyticsCountQueryRequest({
            dimension: AnalyticsAttribute.USER_ID,
            licenseKey,
            start: new Date('2000-01-01'),
            end: new Date(),
            groupBy: [AnalyticsAttribute.CUSTOM_DATA_1],
            filters
        });
        const queryResult = await this.bitmovinApi.analytics.queries.count.create(request);
        return this.parseLikesApiResult(queryResult);
    }

    private async retrieveLikesByDistinctUserId(): Promise<LikesApiResult> {
        const defaultResult = { likes: 0, dislikes: 0 };
        if (this.analyticsLicenseKey == null) {
            return defaultResult;
        }
        if (this.videoId == null) {
            return defaultResult;
        }
        return await this.queryApi(this.analyticsLicenseKey, this.videoId);
    }

    private parseLikesApiResult(response: AnalyticsResponse): LikesApiResult {
        let likes = 0;
        let dislikes = 0;

        if (response.rows != null) {
            likes = this.getRowValue(response.rows, CUSTOM_DATA_LIKE_FLAG, 0);
            dislikes = this.getRowValue(response.rows, CUSTOM_DATA_DISLIKE_FLAG, 0);
        }

        return {
            likes, dislikes
        };
    }

    private getRowValue(rows: Array<any>, key: string, defaultValue: number): number {
        return rows.find(i => Array.isArray(i) && i.length === 2 && i[0] === key)?.[1] ?? defaultValue;
    }

    async retrieveLikeStatus(): Promise<LikeStatus> {
        const result = { liked: false, disliked: false };
        if (this.analytics == null) {
            return result;
        }
        //TODO expose in analytics
        var sessionHandler = (this.analytics as any).sessionHandler;
        var userId: string = sessionHandler?.userId;
        if (userId == null) {
            return result;
        }
        if (this.analyticsLicenseKey == null) {
            return result;
        }
        if (this.videoId == null) {
            return result;
        }
        const apiResult = await this.queryApi(this.analyticsLicenseKey, this.videoId, userId);
        return {
            liked: apiResult.likes > 0,
            disliked: apiResult.dislikes > 0
        };
    }

    private get analyticsLicenseKey(): string | undefined {
        return this.analyticsConfig?.key;
    }

    private get videoId(): string | undefined {
        return this.analyticsConfig?.videoId;
    }

    private get analyticsConfig(): AnalyticsConfig | undefined {
        return (this.analytics as any)?.config as AnalyticsConfig;
    }
}

(window as any).BitmovinPlayerLikePlugin = BitmovinPlayerLikePlugin