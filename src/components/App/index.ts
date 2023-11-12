import store, { addListener, update } from '../../store'
import EditPanel from '../EditPanel'
import type OptcGalleryPanel from '../OptcGalleryPanel'
import type TipsDialog from '../TipsDialog'
import type WantedButton from '../WantedButton'
import WantedPoster, { WantedPosterAttribute } from '../WantedPoster'
import { WARCRIMINAL_POSTER } from './config'
import LaunchHandler from './launch-handler'
import cssContent from './style.css?inline'
import templateContent from './template.html?raw'

const TAG_NAME = 'app-container'

const WARCRIMINAL_HASH = '#warcriminal'

const template = document.createElement('template')
template.innerHTML = templateContent

class App extends HTMLElement {
  #editPanel: EditPanel
  #optcGalleryPanel: OptcGalleryPanel
  #tipsDialog: TipsDialog
  #wantedPoster: WantedPoster
  #uploadInput: HTMLInputElement
  #editButton: WantedButton
  #importButton: WantedButton
  #exportButton: WantedButton
  #criminalButton: HTMLButtonElement
  #tipsButton: HTMLButtonElement
  #optcButton: HTMLButtonElement

  #carouselIntervalId: number = 0

  #startTime: number = 0
  #root: ShadowRoot
  #hashChangeListener: (event: HashChangeEvent) => void
  #storeListener: Parameters<typeof addListener>[1]

  constructor() {
    super()

    // Create a shadow root
    const shadowRoot = this.attachShadow({ mode: 'open' })
    this.#root = shadowRoot

    const style = document.createElement('style')
    style.textContent = cssContent

    // attach the created elements to the shadow DOM
    shadowRoot.append(style, template.content.cloneNode(true))
    shadowRoot.addEventListener('WantedPosterLoaded', () => {
      this.#removeLoading()
    })

    const posterSlot =
      this.#root.querySelector<HTMLSlotElement>('slot[name=poster]')
    this.#wantedPoster = posterSlot?.assignedNodes()[0] as WantedPoster

    this.#editPanel = this.#root.querySelector<EditPanel>('edit-panel')!
    this.#optcGalleryPanel =
      this.#root.querySelector<OptcGalleryPanel>('optc-gallery-panel')!
    this.#tipsDialog = this.#root.querySelector<TipsDialog>('tips-dialog')!

    this.#uploadInput =
      this.#root.querySelector<HTMLInputElement>('#uploadInput')!
    this.#editButton = this.#root.querySelector<WantedButton>('#editButton')!
    this.#importButton =
      this.#root.querySelector<WantedButton>('#importButton')!
    this.#exportButton =
      this.#root.querySelector<WantedButton>('#exportButton')!
    this.#criminalButton =
      this.#root.querySelector<HTMLButtonElement>('#criminalButton')!
    this.#tipsButton =
      this.#root.querySelector<HTMLButtonElement>('#tipsButton')!
    this.#optcButton =
      this.#root.querySelector<HTMLButtonElement>('#optcButton')!

    this.#hashChangeListener = this.#onHashtagChange.bind(this)

    this.#storeListener = (key, value) => {
      switch (key) {
        case 'photoUrl':
          this.#setWantedPosterAttributes({ 'photo-url': value.toString() })
          break
        case 'nameSpacing':
          this.#setWantedPosterAttributes({
            'name-spacing': value.toString()
          })
          break
        case 'bountySpacing':
          this.#setWantedPosterAttributes({
            'bounty-spacing': value.toString()
          })
          break
        case 'bountyFontFamily':
          this.#setWantedPosterAttributes({
            'bounty-font-family': value.toString()
          })
          break

        case 'bountyFontScale':
          this.#setWantedPosterAttributes({
            'bounty-font-scale': value.toString()
          })
          break
        case 'bountyFontWeight':
          this.#setWantedPosterAttributes({
            'bounty-font-weight': value.toString()
          })
          break
        case 'bountyVerticalOffset':
          this.#setWantedPosterAttributes({
            'bounty-vertical-offset': value.toString()
          })
          break
        case 'posterShadow':
          this.#setWantedPosterAttributes({
            'poster-shadow': value.toString()
          })
          break
        case 'photoShadow':
          this.#setWantedPosterAttributes({
            'photo-shadow': value.toString()
          })
          break
        case 'name':
        case 'bounty':
        case 'filter':
          this.#setWantedPosterAttributes({ [key]: value.toString() })
      }
    }
    window.addEventListener('hashchange', this.#hashChangeListener)
  }

  #removeLoading() {
    const loadingOverlay =
      this.#root.querySelector<HTMLElement>('.loading-overlay')!

    const minLoadingTime = 1000
    const intervalId = setInterval(() => {
      const time = new Date().getTime()
      if (time - this.#startTime < minLoadingTime) {
        return
      }

      clearTimeout(intervalId)
      loadingOverlay.style.transition = 'opacity 1s'
      loadingOverlay.style.opacity = '0'

      setTimeout(() => loadingOverlay.remove(), 1000)

      if (location.hash === WARCRIMINAL_HASH) {
        this.#criminalButton.classList.add('criminal--visible')
        return
      }

      setTimeout(
        () => this.#criminalButton.classList.add('criminal--visible'),
        10000
      )
    }, 200)
  }

  #onHashtagChange() {
    this.#toggleWarCriminalMode(location.hash === WARCRIMINAL_HASH)
  }

  #toggleWarCriminalMode(toggle: boolean) {
    const overlay = this.#root.querySelector<HTMLElement>('.blood-overlay')
    if (!overlay) {
      return
    }

    const githubLink = toggle
      ? 'https://github.com/vshymanskyy/StandWithUkraine/blob/main/docs/README.md'
      : 'https://github.com/YuskaWu/one-piece-wanted-poster'
    const githubCorner = document.querySelector<HTMLElement>('github-corner')!
    githubCorner.classList.toggle('gc-ua', toggle)
    githubCorner.setAttribute('href', githubLink)

    this.classList.toggle('warcriminal')
    overlay.classList.toggle('blood-overlay--visible')
    this.#criminalButton.classList.toggle('criminal--stamp')
    this.#tipsButton.classList.toggle('tips-button--hidden')
    this.#optcButton.classList.toggle('optc-button--hidden')
    this.#root
      .querySelector<HTMLDivElement>('.button-container')
      ?.classList.toggle('button-container--hidden')

    if (toggle) {
      update({ ...WARCRIMINAL_POSTER })
    }

    this.#toggleWarCriminalCarousel(toggle)
  }

  #toggleWarCriminalCarousel(toggle: boolean) {
    if (!toggle) {
      clearInterval(this.#carouselIntervalId)
      return
    }

    const length = WARCRIMINAL_POSTER.photoUrls.length
    let index = Math.floor(length * Math.random())

    update({ photoUrl: WARCRIMINAL_POSTER.photoUrls[index] + '#nohighlight' })
    this.#carouselIntervalId = window.setInterval(() => {
      index = (index + 1) % length
      update({ photoUrl: WARCRIMINAL_POSTER.photoUrls[index] + '#nohighlight' })
    }, 5000)
  }

  #setWantedPosterAttributes(attributes: WantedPosterAttribute) {
    const keys = Object.keys(attributes) as Array<keyof WantedPosterAttribute>
    for (const key of keys) {
      const value = attributes[key] ?? ''
      this.#wantedPoster.setAttribute(key, value)
    }
  }

  connectedCallback() {
    this.#startTime = new Date().getTime()

    this.#setWantedPosterAttributes({
      name: store.name,
      bounty: store.bounty.toString(),
      'name-spacing': store.nameSpacing.toString(),
      'bounty-spacing': store.bountySpacing.toString(),
      'poster-shadow': store.posterShadow.toString(),
      'bounty-font-family': store.bountyFontFamily,
      'bounty-font-weight': store.bountyFontWeight.toString(),
      'bounty-vertical-offset': store.bountyVerticalOffset.toString(),
      filter: store.filter
    })

    addListener('photoUrl', this.#storeListener)
    addListener('name', this.#storeListener)
    addListener('bounty', this.#storeListener)
    addListener('nameSpacing', this.#storeListener)
    addListener('bountyFontFamily', this.#storeListener)
    addListener('bountySpacing', this.#storeListener)
    addListener('bountyFontScale', this.#storeListener)
    addListener('bountyFontWeight', this.#storeListener)
    addListener('bountyVerticalOffset', this.#storeListener)
    addListener('posterShadow', this.#storeListener)
    addListener('photoShadow', this.#storeListener)
    addListener('filter', this.#storeListener)

    if (location.hash === WARCRIMINAL_HASH) {
      this.#toggleWarCriminalMode(true)
    }

    this.addEventListener('dragover', (event) => {
      // prevent default to allow drop
      event.preventDefault()
    })

    this.addEventListener('dragenter', () => {
      this.classList.add('dragin')
    })

    this.addEventListener('dragleave', (e) => {
      // The "dragleave" event will trigger whenever cursor cross over the child element
      // which is a web component, so we can not just remove "dragin" style without any judgement.

      // For dragleave event, the "relatedTarget" property menas the element entered to.
      // So if "relatedTarget" is null, it will be the outside of window, which is the case
      // that we want to remove "dragin" style.
      if (e.relatedTarget === null) {
        this.classList.remove('dragin')
      }
    })

    this.addEventListener('drop', (event) => {
      // prevent default action (open as link for some elements)
      event.preventDefault()
      this.classList.remove('dragin')

      const file = event.dataTransfer?.files[0]
      if (!file || !file.type.startsWith('image')) {
        return
      }

      const objUrl = URL.createObjectURL(file)
      store.photoUrl = objUrl
    })

    this.#uploadInput.addEventListener('input', () => {
      const file = this.#uploadInput.files ? this.#uploadInput.files[0] : null
      if (!file || !file.type.startsWith('image')) {
        return
      }

      const objUrl = URL.createObjectURL(file)
      store.photoUrl = objUrl
    })

    this.#editButton.addEventListener('click', () => {
      this.#editPanel.toggle()
    })

    this.#importButton.addEventListener('click', () => {
      this.#uploadInput.value = ''
      this.#uploadInput.click()
    })

    this.#exportButton.addEventListener('click', async () => {
      if (this.#exportButton.loading) {
        return
      }

      this.#exportButton.loading = true
      try {
        await this.#wantedPoster.export()
      } catch (e) {
        console.error(e)
        let message = ''
        if (e instanceof Error) {
          message = e.message
        }
        // TODO show error in dialog instead of alert
        alert(`Oops! something went wrong. 😢 \n ${message}`)
      } finally {
        this.#exportButton.loading = false
      }
    })

    this.#criminalButton.addEventListener('click', () => {
      const isEnabled = location.hash === WARCRIMINAL_HASH
      location.hash = isEnabled ? '' : WARCRIMINAL_HASH
    })

    this.#tipsButton.addEventListener('click', () => {
      this.#tipsDialog.toggle()
    })

    this.#optcButton.addEventListener('click', () => {
      this.#optcGalleryPanel.toggle()
    })

    // set handler for launched file
    LaunchHandler.setConsumer(async (handles) => {
      const handle = handles[0]
      if (!LaunchHandler.isFileHandle(handle)) {
        return
      }
      const blob = await handle.getFile()
      const objUrl = URL.createObjectURL(blob)
      store.photoUrl = objUrl
    })
  }
}

customElements.define(TAG_NAME, App)

export default App
