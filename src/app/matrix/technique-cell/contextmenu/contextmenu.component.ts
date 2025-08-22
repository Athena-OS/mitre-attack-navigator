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
    @Input() mouseX: number = 0;
    @Input() mouseY: number = 0;
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

    public getMenuPosition(): { left: string; top: string } {
        if (!this.mouseX || !this.mouseY) {
            // Fallback to center if no mouse position
            return {
                left: '50%',
                top: '50%',
            };
        }

        // Menu dimensions (approximate) - adjusted for compact design
        const menuWidth = 220; // Smaller width for compact design
        const menuHeight = 350; // Smaller height for compact design

        // Viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate position with intelligent boundary checks
        let left = this.mouseX;
        let top = this.mouseY;

        // Horizontal positioning logic
        const spaceOnRight = viewportWidth - this.mouseX;
        const spaceOnLeft = this.mouseX;

        if (spaceOnRight >= menuWidth) {
            // Enough space on the right, position normally
            left = this.mouseX;
        } else if (spaceOnLeft >= menuWidth) {
            // Not enough space on right, but enough on left
            left = this.mouseX - menuWidth;
        } else {
            // Not enough space on either side, position at edge with padding
            if (spaceOnRight > spaceOnLeft) {
                left = viewportWidth - menuWidth - 10;
            } else {
                left = 10;
            }
        }

        // Vertical positioning logic
        const spaceBelow = viewportHeight - this.mouseY;
        const spaceAbove = this.mouseY;

        if (spaceBelow >= menuHeight) {
            // Enough space below, position normally
            top = this.mouseY;
        } else if (spaceAbove >= menuHeight) {
            // Not enough space below, but enough above
            top = this.mouseY - menuHeight;
        } else {
            // Not enough space above or below, position at edge with padding
            if (spaceBelow > spaceAbove) {
                top = viewportHeight - menuHeight - 10;
            } else {
                top = 10;
            }
        }

        // Final safety checks
        left = Math.max(5, Math.min(left, viewportWidth - menuWidth - 5));
        top = Math.max(5, Math.min(top, viewportHeight - menuHeight - 5));

        return {
            left: `${left}px`,
            top: `${top}px`,
        };
    }
}
