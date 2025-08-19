import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewEncapsulation } from '@angular/core';
import { ContextMenuItem, Link, TechniqueVM, ViewModel } from '../../../classes';
import { Technique, Tactic } from '../../../classes/stix';
import { ViewModelsService } from '../../../services/viewmodels.service';
import { ConfigService } from '../../../services/config.service';
import { CellPopover } from '../cell-popover';
import { openURL } from 'src/app/utils/utils';
import { SyncService } from '../../../services/sync.service';

@Component({
    selector: 'app-contextmenu',
    templateUrl: './contextmenu.component.html',
    styleUrls: ['./contextmenu.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ContextmenuComponent extends CellPopover implements OnInit {
    @Input() technique: Technique;
    @Input() tactic: Tactic;
    @Input() viewModel: ViewModel;
    public placement: string;
    @Output() close = new EventEmitter<any>();

    // Track offline availability
    public techniqueOfflineAvailable: boolean = false;
    public tacticOfflineAvailable: boolean = false;

    public get techniqueVM(): TechniqueVM {
        return this.viewModel.getTechniqueVM(this.technique, this.tactic);
    }

    public get links(): Link[] {
        return this.techniqueVM.links;
    }

    constructor(
        private element: ElementRef,
        public configService: ConfigService,
        public viewModelsService: ViewModelsService,
        private syncService: SyncService
    ) {
        super(element);
    }

    ngOnInit() {
        this.placement = this.getPosition();
        this.checkOfflineAvailability();
    }

    private async checkOfflineAvailability() {
        const urls = [];
        if (this.technique?.url) urls.push(this.technique.url);
        if (this.tactic?.url) urls.push(this.tactic.url);

        if (urls.length > 0) {
            const availability = await this.syncService.checkOfflineAvailability(urls);
            if (this.technique?.url) this.techniqueOfflineAvailable = availability[0] || false;
            if (this.tactic?.url) this.tacticOfflineAvailable = availability[this.technique?.url ? 1 : 0] || false;
        }
    }

    public closeContextmenu() {
        this.close.emit();
    }

    public select() {
        this.viewModel.clearSelectedTechniques();
        this.viewModel.selectTechnique(this.technique, this.tactic);
        this.closeContextmenu();
    }

    public addSelection() {
        this.viewModel.selectTechnique(this.technique, this.tactic);
        this.closeContextmenu();
    }

    public removeSelection() {
        this.viewModel.unselectTechnique(this.technique, this.tactic);
        this.closeContextmenu();
    }

    public selectAll() {
        this.viewModel.selectAllTechniques();
        this.closeContextmenu();
    }

    public deselectAll() {
        this.viewModel.clearSelectedTechniques();
        this.closeContextmenu();
    }

    public invertSelection() {
        this.viewModel.invertSelection();
        this.closeContextmenu();
    }

    public selectAnnotated() {
        this.viewModel.selectAnnotated();
        this.closeContextmenu();
    }

    public selectUnannotated() {
        this.viewModel.selectUnannotated();
        this.closeContextmenu();
    }

    public selectAllInTactic() {
        this.viewModel.selectAllTechniquesInTactic(this.tactic);
        this.closeContextmenu();
    }

    public deselectAllInTactic() {
        this.viewModel.unselectAllTechniquesInTactic(this.tactic);
        this.closeContextmenu();
    }

    public viewTechnique(forceOnline: boolean = false) {
        openURL(this.technique.url, !forceOnline);
        this.closeContextmenu();
    }

    public viewTactic(forceOnline: boolean = false) {
        openURL(this.tactic.url, !forceOnline);
        this.closeContextmenu();
    }

    public pinCell() {
        this.viewModelsService.pinnedCell =
            this.viewModelsService.pinnedCell === this.techniqueVM.technique_tactic_union_id ? '' : this.techniqueVM.technique_tactic_union_id;
        this.closeContextmenu();
    }

    public openCustomContextMenuItem(customItem: ContextMenuItem) {
        openURL(customItem.getReplacedURL(this.technique, this.tactic));
        this.closeContextmenu();
    }

    public openLink(link: Link) {
        openURL(link.url);
        this.closeContextmenu();
    }
}
