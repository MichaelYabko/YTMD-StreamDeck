import {
    KeyUpEvent,
    SDOnActionEvent,
    WillAppearEvent,
    WillDisappearEvent,
} from 'streamdeck-typescript';
import {StateOutput} from 'ytmdesktop-ts-companion';
import {SeekSettings} from '../interfaces/context-settings.interface';
import {YTMD} from '../ytmd';
import {DefaultAction} from './default.action';

export class SeekAction extends DefaultAction<SeekAction> {
    private currentPosition: number = 0;
    private currentDuration: number = 0;
    private events: { context: string, listener: (state: StateOutput) => void }[] = [];

    constructor(private plugin: YTMD, actionName: string) {
        super(plugin, actionName);
    }

    @SDOnActionEvent('willAppear')
    onContextAppear({context}: WillAppearEvent): void {
        if (this.events.find(e => e.context === context)) return;

        const listener = (state: StateOutput) => {
            this.currentPosition = state.player?.videoProgress ?? 0;
            this.currentDuration = state.video?.durationSeconds ?? 0;
        };

        this.events.push({context, listener});
        this.socket.addStateListener(listener);
    }

    @SDOnActionEvent('willDisappear')
    onContextDisappear(event: WillDisappearEvent): void {
        const found = this.events.find(e => e.context === event.context);
        if (!found) return;

        this.socket.removeStateListener(found.listener);
        this.events = this.events.filter(e => e.context !== event.context);
    }

    @SDOnActionEvent('keyUp')
    onKeypressUp({context, payload: {settings}}: KeyUpEvent<SeekSettings>) {
        const offset = Number(settings?.seconds);
        if (!Number.isFinite(offset) || offset === 0) {
            this.plugin.showAlert(context);
            return;
        }

        let target = this.currentPosition + offset;
        if (target < 0) target = 0;
        if (this.currentDuration > 0 && target > this.currentDuration) target = this.currentDuration;

        this.rest.seekTo(target).catch(reason => {
            console.error(reason);
            this.plugin.logMessage(`Error while seeking. target: ${target}, context: ${JSON.stringify(context)}, error: ${JSON.stringify(reason)}`);
            this.plugin.showAlert(context);
        });
    }
}
