# CSS код мини-виджета заказов

## Основные стили виджета

```css
.user-orders-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-height: 18vh;
  min-height: 60px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.2s ease;
}

/* Анимация расширения вверх */
.user-orders-widget.expanded {
  max-height: 60vh;
  transition: max-height 0.3s ease-out;
}
```

## Размеры дива самого заказа (order-item)

```css
/* Список заказов — компактная прокрутка */
.orders-list {
  max-height: 280px;
  overflow-y: auto;
  background: white;
}

/* === КОМПАКТНЫЙ ДИВ ЗАКАЗА === */
.order-item {
  padding: 6px 10px;           /* ← ВАЖНО: Внутренний отступ (вертикальный: 6px, горизонтальный: 10px) */
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  transition: all 0.2s;
}

.order-item:hover {
  background: #f8fafc;
}

.order-item.selected {
  background: #eef2ff;
  border-left: 3px solid #667eea;
}

/* Заголовок заказа */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;                    /* ← Расстояние между номером и статусом */
  margin-bottom: 4px;           /* ← Отступ снизу от заголовка */
}

/* Номер заказа */
.order-number {
  font-weight: 700;
  font-size: 12px;              /* ← Размер шрифта номера заказа */
  color: #1e293b;
  letter-spacing: -0.2px;
}

/* Статус заказа */
.order-status {
  font-size: 9px;               /* ← Размер шрифта статуса заказа */
  font-weight: 700;
  padding: 3px 8px;             /* ← Внутренний отступ статуса (вертикальный: 3px, горизонтальный: 8px) */
  border-radius: 40px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: #e2e8f0;
  color: #1e293b;
  box-shadow: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
```

## Ключевые размеры для компактности:

| Элемент | Размер | Описание |
|---------|--------|----------|
| `.order-item` padding | `6px 10px` | Вертикальный: 6px, Горизонтальный: 10px |
| `.order-header` gap | `8px` | Расстояние между номером и статусом |
| `.order-header` margin-bottom | `4px` | Отступ снизу от заголовка |
| `.order-number` font-size | `12px` | Размер шрифта номера заказа |
| `.order-status` font-size | `9px` | Размер шрифта статуса заказа |
| `.order-status` padding | `3px 8px` | Вертикальный: 3px, Горизонтальный: 8px |

## Полный код для копирования:

```css
/* === МИНИ-ВИДЖЕТ ЗАКАЗОВ === */
.user-orders-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-height: 18vh;
  min-height: 60px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.2s ease;
}

.user-orders-widget.expanded {
  max-height: 60vh;
  transition: max-height 0.3s ease-out;
}

/* Список заказов */
.orders-list {
  max-height: 280px;
  overflow-y: auto;
  background: white;
}

/* === КОМПАКТНЫЙ ДИВ ЗАКАЗА === */
.order-item {
  padding: 6px 10px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  transition: all 0.2s;
}

.order-item:hover {
  background: #f8fafc;
}

.order-item.selected {
  background: #eef2ff;
  border-left: 3px solid #667eea;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.order-number {
  font-weight: 700;
  font-size: 12px;
  color: #1e293b;
  letter-spacing: -0.2px;
}

.order-status {
  font-size: 9px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 40px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: #e2e8f0;
  color: #1e293b;
  box-shadow: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
```

## Как использовать:

1. Скопируйте код выше
2. Вставьте в ваш CSS файл
3. Добавьте класс `expanded` к виджету, когда есть заказы:
   ```jsx
   <div className={`user-orders-widget ${orders.length > 0 ? 'expanded' : ''}`}>