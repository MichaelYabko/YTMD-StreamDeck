import {DidReceiveSettingsEvent} from 'streamdeck-typescript';
import {SeekSettings} from '../../interfaces/context-settings.interface';
import {YTMDPi} from '../../ytmd-pi';
import {PisAbstract} from '../pis.abstract';

export class SeekPi extends PisAbstract {

    constructor(pi: YTMDPi, context: string, sectionElement: HTMLElement) {
        super(pi, context, sectionElement);

        this.setSettingsToHtml();
        pi.requestSettings();

        this.pi.seekSecondsInput.addEventListener('keyup', () => this.persist());
        this.pi.seekSecondsInput.addEventListener('change', () => this.persist());
    }

    public newSettingsReceived({payload: {settings}}: DidReceiveSettingsEvent<SeekSettings>): void {
        this.setSettingsToHtml(settings?.seconds);
    }

    private persist(): void {
        const value = this.pi.seekSecondsInput.valueAsNumber;
        if (!Number.isFinite(value)) return;
        const rounded = Math.trunc(value);
        this.settingsManager.setContextSettingsAttributes(
            this.context,
            {seconds: rounded},
            500
        );
    }

    private setSettingsToHtml(value: number = -10): void {
        this.pi.seekSecondsInput.value = String(value);
    }
}
