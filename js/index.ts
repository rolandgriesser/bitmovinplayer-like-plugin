import { Bitmovin8Adapter } from 'bitmovin-analytics'
import '@bitmovin/api-sdk'
import { PlayerAPI } from 'bitmovin-player';
import { Analytics } from 'bitmovin-analytics/js/core/Analytics';

class BitmovinPlayerLikePlugin {
    private analytics: Analytics | undefined;

    constructor(private player: PlayerAPI) {
        this.analytics = (this.player as any).analytics as Analytics;
        // Todo videochange
    }

    like() {


        this.analytics?.setCustomDataOnce({ customData1: 'like' })
    }

    async retrieveLikeStatus(licenseKey: string, userId: string, videoId: string) {

    }

    async retrieveLikesByDistinctUserId(licenseKey: string, videoId: string): Promise<number> {
        return 0;

    }
}