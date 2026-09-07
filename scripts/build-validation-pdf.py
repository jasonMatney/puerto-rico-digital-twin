import json, os
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_LEFT
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data=json.load(open(BASE+'/public/data/facilities.geojson'))
items=sorted([f for f in data['features'] if f['properties']['kind']=='shelter'],key=lambda f:int(f['properties']['id'].split('-')[1]))
out=BASE+'/output/pdf/toa-baja-validacion-municipal.pdf'
c=canvas.Canvas(out,pagesize=(612,792));c.setTitle('Toa Baja | Paquete de validación municipal');c.setAuthor('Prototipo independiente Toa Baja')
navy=HexColor('#102d3b');green=HexColor('#527b28');muted=HexColor('#49616c')
style=ParagraphStyle('body',fontName='Helvetica',fontSize=11,leading=16,textColor=navy)
def para(text,x,y,w=516,size=11):
 st=ParagraphStyle('p',parent=style,fontSize=size,leading=size*1.4);p=Paragraph(text,st);_,h=p.wrap(w,700);p.drawOn(c,x,y-h);return y-h

def header(n,title):
 c.setFillColor(navy);c.rect(0,710,612,82,fill=1,stroke=0);c.setFillColor(HexColor('#b7f578'));c.setFont('Helvetica-Bold',10);c.drawString(48,760,'TOA BAJA / VALIDACIÓN MUNICIPAL')
 c.setFillColor(HexColor('#ffffff'));c.setFont('Helvetica-Bold',20);c.drawString(48,731,title)
 c.setFillColor(muted);c.setFont('Helvetica',9);c.drawString(48,34,'Prototipo independiente. No emitido ni aprobado por PRDOH o el Municipio.');c.drawRightString(564,20,f'7 septiembre 2026 | {n} / 3')
header(1,'Guía de revisión y respuesta')
y=para('<b>Objetivo.</b> Confirmar nombres, ubicaciones y datos operativos de 12 refugios designados en la lista PRDOH 2026. Este PDF resume el inventario original y preguntas documentales; no certifica disponibilidad ni acceso seguro.',48,685)
y=para('<b>Prioridad 1 - Pipo Negrón.</b> PRDOH usa José; la página de Servicios Municipales y el SIG municipal usan Rafael. Confirmar el nombre oficial y que las referencias identifican la misma instalación. La propuesta Rafael permanece pendiente.',48,y-18)
y=para('<b>Prioridad 2 - Pedro Albizu Campos.</b> El punto procede del inventario de 2019 incluido en el plan de mitigación de 2024. Confirmar edificio y entrada con SIG municipal o evidencia de campo. No se propone una coordenada sustituta.',48,y-18)
y=para('<b>Cómo completar el CSV</b><br/>1. Conservar id_refugio y las columnas de referencia; completar las columnas terminadas en respuesta y los campos de confirmación.<br/>2. Coordenadas: WGS84, grados decimales, latitud y longitud separadas. Registrar ambas o dejar ambas vacías.<br/>3. Estado: abierto, cerrado, espera o desconocido; anotar la fecha real de observación (AAAA-MM-DD). La designación no implica apertura.<br/>4. Capacidad: personas; vacío significa desconocida y 0 significa cero confirmado.<br/>5. Identificar revisor/organización, documento, enlace de evidencia y preguntas pendientes.',48,y-20)
y=para('<b>Después de recibir respuestas.</b> Revisar la evidencia y registrar cada hallazgo en Verify records. El CSV no se importa automáticamente. Una corrección requiere vista previa y aprobación explícita antes de cambiar el mapa privado; se conserva el historial.',48,y-18)
y=para('<b>Fuentes y límites</b><br/><a href="https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf">[1] PRDOH: Refugios 2026, PDF pp. 17-18</a><br/><a href="https://toabaja.com/servicios-municipales/">[2] Toa Baja: Servicios Municipales (sin fecha; consulta 7 sep. 2026)</a><br/><a href="https://toabaja.com/temporada-de-huracanes/">[3] Toa Baja: Temporada de Huracanes (sin fecha; consulta 7 sep. 2026)</a><br/>Los enlaces por instalación se incluyen en las páginas siguientes y en el CSV. Este PDF es un resumen fijo; el CSV descargado desde la cola refleja los registros cargados al exportar. No se envió comunicación a terceros.',48,y-18,size=10)
assert y>55,y
c.showPage()
for page in [2,3]:
 header(page,'Inventario original / '+('1-6' if page==2 else '7-12'))
 y=para('Todas las ubicaciones requieren validación local. Estado operativo y capacidad: sin confirmar. Las coordenadas son puntos de referencia, no entradas verificadas.',48,687,size=10)-16
 for f in items[(page-2)*6:(page-1)*6]:
  p=f['properties'];lat=f['geometry']['coordinates'][1];lon=f['geometry']['coordinates'][0]
  y=para(f'<b>{escape(p["id"])} | {escape(p["name"])}</b>',48,y,size=11)
  y=para(f'{lat:.6f}, {lon:.6f} | {escape(p["vintage"])}',48,y-3,size=9)
  note='Confirmar nombre oficial e identidad: José / Rafael.' if p['id']=='shelter-3' else 'Confirmar coordenadas históricas, edificio y entrada.' if p['id']=='shelter-6' else 'Confirmar nombre, ubicación, operación y capacidad con fecha y evidencia.'
  y=para(note,48,y-3,size=10)
  links=' | '.join(f'<a href="{escape(s["url"],{chr(34):"&quot;"})}">{escape(s["label"])}</a>' for s in p['sources'])
  y=para(links,48,y-3,size=9)-14
  c.setStrokeColor(HexColor('#d7e0e3'));c.line(48,y+6,564,y+6)
 assert y>55,y
 c.showPage()
c.save();print(out)
