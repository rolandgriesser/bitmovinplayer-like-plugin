// import '@bitmovin/api-sdk'
import { PlayerAPI } from 'bitmovin-player';
import { Analytics } from 'bitmovin-analytics/js/core/Analytics';
import BitmovinApi, { AnalyticsAttribute, AnalyticsCountQueryRequest, AnalyticsEqualFilter, AnalyticsInFilter, AnalyticsQueryOperator, AnalyticsResponse, PlayerLicense } from '@bitmovin/api-sdk';
import { AnalyticsConfig } from 'bitmovin-analytics/js/types/AnalyticsConfig';

const CUSTOM_DATA_LIKE_FLAG = 'like';
const CUSTOM_DATA_DISLIKE_FLAG = 'dislike';

interface LikesApiResult {
    likes: number;
    dislikes: number;
}

export class BitmovinPlayerLikePlugin {
    private analytics: Analytics | undefined;
    private bitmovinApi: BitmovinApi;

    constructor(private player: PlayerAPI, private apiKey: string) {
        console.log('Creating BitmovinPlayerLikePlugin...')
        this.analytics = (this.player as any).analytics as Analytics;
        console.log(`Created BitmovinPlayerLikePlugin, analytics module was ${this.analytics == null ? 'not ' : ''}found.`)
        this.bitmovinApi = new BitmovinApi({ apiKey });
        this.createUI();
        // Todo videochange
    }

    like() {
        this.analytics?.setCustomDataOnce({ customData1: CUSTOM_DATA_LIKE_FLAG })
    }

    async createUI() {
        const alreadyLiked = await this.retrieveLikeStatus();
        const likes = await this.retrieveLikesByDistinctUserId();

        console.log(`Total likes: ${likes}, already liked: ${alreadyLiked}`)
    }

    async retrieveLikesByDistinctUserId(): Promise<number> {

        const request = new AnalyticsCountQueryRequest({
            dimension: AnalyticsAttribute.USER_ID,
            licenseKey: this.analyticsLicenseKey,
            start: new Date('2000-01-01'),
            end: new Date(),
            groupBy: [AnalyticsAttribute.CUSTOM_DATA_1],
            filters: [
                new AnalyticsEqualFilter({ name: AnalyticsAttribute.VIDEO_ID, value: this.videoId }),
                new AnalyticsInFilter({ name: AnalyticsAttribute.CUSTOM_DATA_1, value: [CUSTOM_DATA_LIKE_FLAG, CUSTOM_DATA_DISLIKE_FLAG] }),
            ]
        });
        const countQuery = await this.bitmovinApi.analytics.queries.count.create(request);
        return countQuery?.rows?.[0]?.[0] ?? 0;
    }

    private parseLikesApiResult(response: AnalyticsResponse): LikesApiResult {
        let likes = 0;
        let dislikes = 0;

        return {
            likes, dislikes
        };
    }

    async retrieveLikeStatus() {
        //licenseKey: string, userId: string, videoId: string
        if (this.analytics == null) {
            return;
        }
        //TODO expose
        var sessionHandler = (this.analytics as any).sessionHandler;
        var userId: string = sessionHandler?.userId;
        if (userId == null) {
            return;
        }
        if (this.analyticsLicenseKey == null) {
            return;
        }
        if (this.videoId == null) {
            return;
        }
        const request = new AnalyticsCountQueryRequest({
            dimension: AnalyticsAttribute.IMPRESSION_ID,
            licenseKey: this.analyticsLicenseKey,
            start: new Date('2000-01-01'),
            end: new Date(),
            groupBy: [AnalyticsAttribute.CUSTOM_DATA_1],
            filters: [
                new AnalyticsEqualFilter({ name: AnalyticsAttribute.USER_ID, value: userId }),
                new AnalyticsEqualFilter({ name: AnalyticsAttribute.VIDEO_ID, value: this.videoId }),
                new AnalyticsInFilter({ name: AnalyticsAttribute.CUSTOM_DATA_1, value: [CUSTOM_DATA_LIKE_FLAG, CUSTOM_DATA_DISLIKE_FLAG] }),
            ]
        });
        const countQuery = await this.bitmovinApi.analytics.queries.count.create(request);
        return (countQuery?.rows?.[0]?.[0] ?? 0) > 0;
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