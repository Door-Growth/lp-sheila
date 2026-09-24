const header=document.querySelector('.site-header');
const menu=document.querySelector('#menu');
const toggle=document.querySelector('.menu-toggle');

if(header&&menu&&toggle){
  const updateHeader=()=>header.classList.toggle('scrolled',scrollY>20);
  updateHeader();
  addEventListener('scroll',updateHeader,{passive:true});
  toggle.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
  addEventListener('keydown',event=>{
    if(event.key==='Escape'&&menu.classList.contains('open')){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.focus();
    }
  });
}

const revealElements=document.querySelectorAll('.reveal');
if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }),{threshold:.12});
  revealElements.forEach(element=>observer.observe(element));
}else{
  revealElements.forEach(element=>element.classList.add('visible'));
}

const videos=[...document.querySelectorAll('video')];
videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause()})));

const track=document.querySelector('.carousel-track');
const cards=[...document.querySelectorAll('.testimonial-card')];
const dots=document.querySelector('.carousel-dots');
const previous=document.querySelector('.carousel-btn.prev');
const next=document.querySelector('.carousel-btn.next');

if(track&&cards.length&&dots&&previous&&next){
  let current=Math.min(1,cards.length-1);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const go=(index,shouldScroll=true)=>{
    current=(index+cards.length)%cards.length;
    cards.forEach((card,number)=>card.classList.toggle('active',number===current));
    [...dots.children].forEach((dot,number)=>dot.classList.toggle('active',number===current));
    if(shouldScroll){
      const card=cards[current];
      track.scrollTo({left:card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,behavior:reducedMotion.matches?'auto':'smooth'});
    }
  };
  cards.forEach((_,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.setAttribute('aria-label',`Mostrar depoimento ${index+1}`);
    button.addEventListener('click',()=>go(index));
    dots.appendChild(button);
  });
  previous.addEventListener('click',()=>go(current-1));
  next.addEventListener('click',()=>go(current+1));
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')go(current-1);
    if(event.key==='ArrowRight')go(current+1);
  });
  go(current,false);

  if(typeof HTMLDialogElement!=='undefined'){
    const lightbox=document.createElement('dialog');
    lightbox.className='testimonial-lightbox';
    lightbox.setAttribute('aria-label','Depoimento ampliado');
    lightbox.innerHTML='<button type="button" aria-label="Fechar imagem ampliada">×</button><img alt="">';
    document.body.appendChild(lightbox);
    const lightboxImage=lightbox.querySelector('img');
    lightbox.querySelector('button').addEventListener('click',()=>lightbox.close());
    lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close()});
    cards.forEach(card=>{
      const image=card.querySelector('img');
      if(!image)return;
      image.tabIndex=0;
      image.setAttribute('role','button');
      image.setAttribute('aria-label',`${image.alt}. Clique para ampliar`);
      const open=()=>{
        lightboxImage.src=image.currentSrc||image.src;
        lightboxImage.alt=image.alt;
        lightbox.showModal();
      };
      image.addEventListener('click',open);
      image.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}
      });
    });
  }
}
