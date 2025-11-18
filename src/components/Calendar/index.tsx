/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";

import FullCalendar from "@fullcalendar/react";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type { EventInput } from "@fullcalendar/core/index.js";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { updateEvent } from "../../store/schedule/actions";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const dispatch = useDispatch();

  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    schedule?.scheduleStartDate ? dayjs(schedule.scheduleStartDate).toDate() : new Date()
  );
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [pairHighlights, setPairHighlights] = useState<{[key: string]: string}>({});

  const getPlugins = () => {
    const plugins = [dayGridPlugin];

    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
  };

  const getAssigmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const validDates = () => {
    if(!schedule?.scheduleStartDate || !schedule?.scheduleEndDate) return [];
    
    const dates = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates = [];
    const start = dayjs(startDate, "DD.MM.YYYY").toDate();
    const end = dayjs(endDate, "DD.MM.YYYY").toDate();
    const current = new Date(start);

    while (current <= end) {
      dates.push(dayjs(current).format("DD-MM-YYYY"));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const getShiftColor = (shiftName: string, shiftStart?: string, shiftEnd?: string) => {
    if (!shiftName) return 'bg-shift-day';
    
    const nameLower = shiftName.toLowerCase().trim();
    
    if (nameLower.includes('izin') || nameLower.includes('off') || nameLower.includes('tatil')) {
      return 'bg-shift-off';
    }
    
    if (nameLower.includes('night') || nameLower.includes('gece')) {
      return 'bg-shift-night';
    }
    
    if (nameLower.includes('morning') || nameLower.includes('sabah') || 
        nameLower.includes('öğlen') || nameLower.includes('oglen') || 
        nameLower.includes('noon') || nameLower.includes('afternoon')) {
      return 'bg-shift-noon';
    }
    
    if (shiftStart && shiftEnd) {
      const startHour = parseInt(shiftStart.split(':')[0]);
      const endHour = parseInt(shiftEnd.split(':')[0]);
      
      if (startHour >= 20 || (endHour <= 6 && endHour > 0)) {
        return 'bg-shift-night';
      }
      
      if (startHour >= 8 && startHour <= 14) {
        return 'bg-shift-noon';
      }
    }
    
    return 'bg-shift-day';
  };

  const getStaffColor = (staffId: string) => {
    if (!schedule?.staffs) return 'bg-one';
    
    const staffIndex = schedule.staffs.findIndex(s => s.id === staffId);
    if (staffIndex === -1) return 'bg-one';
    
    const colorClasses = [
      'bg-one', 'bg-two', 'bg-three', 'bg-four', 'bg-five',
      'bg-six', 'bg-seven', 'bg-eight', 'bg-nine', 'bg-ten',
      'bg-eleven', 'bg-twelve', 'bg-thirteen', 'bg-fourteen', 'bg-fifteen',
      'bg-sixteen', 'bg-seventeen', 'bg-eighteen', 'bg-nineteen', 'bg-twenty',
      'bg-twenty-one', 'bg-twenty-two', 'bg-twenty-three', 'bg-twenty-four', 'bg-twenty-five',
      'bg-twenty-six', 'bg-twenty-seven', 'bg-twenty-eight', 'bg-twenty-nine', 'bg-thirty',
      'bg-thirty-one', 'bg-thirty-two', 'bg-thirty-three', 'bg-thirty-four', 'bg-thirty-five',
      'bg-thirty-six', 'bg-thirty-seven', 'bg-thirty-eight', 'bg-thirty-nine', 'bg-forty'
    ];
    
    return colorClasses[staffIndex % colorClasses.length];
  };

  const getStaffColorHex = (staffId: string) => {
    if (!schedule?.staffs) return '#fcc729';
    
    const staffIndex = schedule.staffs.findIndex(s => s.id === staffId);
    if (staffIndex === -1) return '#fcc729';
    
    const colorHexes = [
      '#fcc729', '#ff8847', '#c0c033', '#32a852', '#32a8a2',
      '#327ba8', '#3244a8', '#5a32a8', '#a832a4', '#d4b800',
      '#c2068a', '#c28d06', '#a2c206', '#3bc206', '#108f7c',
      '#10278f', '#51108f', '#118f22', '#620878', '#40690a',
      '#0d9488', '#09aa1d', '#0891b2', '#65a30d', '#16a34a',
      '#47216b', '#447804', '#933862', '#4d7c0f', '#2a7626',
      '#b6065f', '#0e7490', '#c8b062', '#a749b7', '#84cc16',
      '#13249d', '#01c40b', '#2e6332', '#70ae19', '#b3524c'
    ];
    
    return colorHexes[staffIndex % colorHexes.length];
  };

  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  const generateStaffBasedCalendar = () => {
    if(!schedule || !schedule.assignments) {
      setEvents([]);
      return;
    }
    
    const works: EventInput[] = [];

    const filteredAssignments = schedule.assignments.filter(
      (assign) => assign.staffId === selectedStaffId
    ) || [];

    for (let i = 0; i < filteredAssignments.length; i++) {
      const assignmentDate = dayjs
        .utc(filteredAssignments[i]?.shiftStart)
        .format("YYYY-MM-DD");
      const isValidDate = validDates().includes(assignmentDate);
      
      const shift = getShiftById(filteredAssignments[i]?.shiftId);
      const shiftName = shift?.name || "Shift";
      const colorClass = getShiftColor(shiftName, shift?.shiftStart, shift?.shiftEnd);

      let backgroundColor = undefined;
      let borderColor = undefined;
      let textColor = undefined;
      
      if (colorClass === 'bg-shift-night') {
        backgroundColor = '#191990';
        borderColor = '#0a58ca';
        textColor = '#ffffff';
      } else if (colorClass === 'bg-shift-noon') {
        backgroundColor = '#FFC107';  // Morning için sarı
        borderColor = '#cc9a06';
        textColor = '#000000';
      } else if (colorClass === 'bg-shift-day') {
        backgroundColor = '#955f1f';  // Day için turkuaz
        borderColor = '#098a91';
        textColor = '#ffffff';
      }

      const work = {
        id: filteredAssignments[i]?.id,
        title: shiftName,
        duration: "01:00",
        date: assignmentDate,
        staffId: filteredAssignments[i]?.staffId,
        shiftId: filteredAssignments[i]?.shiftId,
        shiftStart: filteredAssignments[i]?.shiftStart,
        shiftEnd: filteredAssignments[i]?.shiftEnd,
        className: `event ${colorClass} ${
          getAssigmentById(filteredAssignments[i]?.id)?.isUpdated
            ? "highlight"
            : ""
        } ${!isValidDate ? "invalid-date" : ""}`,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: textColor,
      };
      works.push(work);
    }

    const offDays = schedule?.staffs?.find(
      (staff) => staff.id === selectedStaffId
    )?.offDays;
    
    let highlightedDates: string[] = [];
    
    if(schedule?.scheduleStartDate && schedule?.scheduleEndDate) {
      const dates = getDatesBetween(
        dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
        dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
      );

      dates.forEach((date) => {
        const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
        if (offDays?.includes(transformedDate)) highlightedDates.push(date);
      });
    }

    const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
    const pairColors: {[key: string]: string} = {};
    
    if(selectedStaff?.pairList && selectedStaff.pairList.length > 0) {
      selectedStaff.pairList.forEach((pair: any) => {
        if(pair.startDate && pair.endDate) {
          const pairStaff = schedule?.staffs?.find(s => s.id === pair.pairStaffId);
          if(pairStaff) {
            const pairColorHex = getStaffColorHex(pair.pairStaffId);
            const pairDates = getDatesBetween(pair.startDate, pair.endDate);
            
            pairDates.forEach(date => {
              pairColors[date] = pairColorHex;
            });
          }
        }
      });
    }

    setPairHighlights(pairColors);
    setHighlightedDates(highlightedDates);
    setEvents(works);
  };

  useEffect(() => {
    if(schedule?.staffs && schedule.staffs.length > 0) {
      if(!selectedStaffId || !schedule.staffs.find(s => s.id === selectedStaffId)) {
        const firstStaffId = schedule.staffs[0].id;
        setSelectedStaffId(firstStaffId);
      }
    }
  }, [schedule]);

  useEffect(() => {
    if(selectedStaffId && schedule?.assignments) {
      generateStaffBasedCalendar();
    }
  }, [selectedStaffId, schedule]);


  const RenderEventContent = ({ eventInfo }: any) => {
    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  if(!schedule || !schedule.staffs || schedule.staffs.length === 0) {
    return (
      <div className="calendar-section">
        <div className="calendar-wrapper">
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
          <h3>Please wait loading calendar..</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-section">
      {showPopup && selectedEvent && (
        <div className="event-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="event-popup" onClick={(e) => e.stopPropagation()}>
            <div 
              className="popup-header"
              style={{
                background: selectedEvent.staffColor 
                  ? `linear-gradient(135deg, ${selectedEvent.staffColor} 0%, ${darkenColor(selectedEvent.staffColor, 20)} 100%)`
                  : 'transparent'
              }}
            >
              <h3>Event Details</h3>
              <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
            </div>
            <div className="popup-content">
              <div className="popup-row">
                <svg className="popup-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <strong>Staff:</strong> <span>{selectedEvent.staffName}</span>
              </div>
              <div className="popup-row">
                <svg className="popup-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <strong>Shift:</strong> 
                <span>
                  <span className={`shift-badge ${selectedEvent.shiftClass || 'shift-day'}`}>
                    {selectedEvent.shiftName}
                  </span>
                </span>
              </div>
              <div className="popup-row">
                <svg className="popup-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <strong>Date:</strong> <span>{selectedEvent.date}</span>
              </div>
              <div className="popup-row">
                <svg className="popup-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <strong>Start:</strong> <span>{selectedEvent.startTime}</span>
              </div>
              <div className="popup-row">
                <svg className="popup-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <strong>End:</strong> <span>{selectedEvent.endTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any) => {
            const staffColor = getStaffColorHex(staff.id);
            const isActive = staff.id === selectedStaffId;
            return (
              <div
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={`staff ${getStaffColor(staff.id)} ${
                  isActive ? "active" : ""
                }`}
                style={{
                  borderColor: staffColor,
                  ...(isActive ? {} : { color: staffColor })
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  style={{
                    fill: isActive ? '#ffffff' : staffColor
                  }}
                >
                  <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
                </svg>
                <span>{staff.name}</span>
              </div>
            );
          })}
        </div>
        <FullCalendar
          ref={calendarRef}
          locale={auth?.language || "en"}
          plugins={getPlugins()}
          contentHeight="auto"
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'datePicker'
          }}
          buttonText={{
            today: 'Today'
          }}
          customButtons={{
            datePicker: {
              text: 'Date',
              hint: 'Go to date',
              click: function(ev: any) {
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                
                const button = ev.target as HTMLElement;
                const rect = button.getBoundingClientRect();
                
                dateInput.style.cssText = `
                  position: fixed;
                  top: ${rect.bottom + 5}px;
                  left: ${rect.left}px;
                  opacity: 0;
                  pointer-events: none;
                  z-index: -1;
                  width: 0;
                  height: 0;
                `;
                
                const handleChange = (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target.value && calendarRef.current) {
                    calendarRef.current.getApi().gotoDate(target.value);
                  }
                  dateInput.removeEventListener('change', handleChange);
                  if (dateInput.parentNode) {
                    dateInput.parentNode.removeChild(dateInput);
                  }
                };
                
                dateInput.addEventListener('change', handleChange);
                document.body.appendChild(dateInput);
                
                setTimeout(() => {
                  if (dateInput.showPicker) {
                    dateInput.showPicker();
                  } else {
                    dateInput.click();
                  }
                }, 10);
              }
            }
          }}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          datesSet={(info: any) => {
            if(!schedule?.scheduleStartDate || !schedule?.scheduleEndDate) return;
            
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (!prevButton || !nextButton) return;

            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());

            const currentViewMonth = dayjs(info.start).startOf('month');
            
            const scheduleStartMonth = dayjs.utc(schedule.scheduleStartDate).startOf('month');
            const scheduleEndMonth = dayjs.utc(schedule.scheduleEndDate).endOf('month');
            
            const prevMonth = currentViewMonth.subtract(1, 'month');
            prevButton.disabled = prevMonth.isBefore(scheduleStartMonth, 'month');
            
            const nextMonth = currentViewMonth.add(1, 'month');
            nextButton.disabled = nextMonth.isAfter(scheduleEndMonth, 'month');
          }}
          dayCellContent={({ date }) => {
            const found = validDates().includes(
              dayjs(date).format("YYYY-MM-DD")
            );
            const isHighlighted = highlightedDates.includes(
              dayjs(date).format("DD-MM-YYYY")
            );
            
            const dateKey = dayjs(date).format("DD-MM-YYYY");
            const isPairDay = pairHighlights[dateKey];
            
            let cellStyle = {};
            if(isPairDay) {
              cellStyle = {
                borderBottom: `4px solid ${isPairDay}`
              };
            }

            return (
              <div
                style={cellStyle}
                className={`${found ? "" : "date-range-disabled"} ${
                  isHighlighted ? "highlighted-date-orange" : ""
                } ${isPairDay ? "highlightedPair" : ""}`}
              >
                {dayjs(date).date()}
              </div>
            );
          }}
          eventClick={(info) => {
            const event = info.event;
            const assignment = schedule?.assignments?.find(a => a.id === event.id);
            const shift = getShiftById(event.extendedProps.shiftId);
            const staff = schedule?.staffs?.find(s => s.id === event.extendedProps.staffId);
            
            const shiftColorClass = getShiftColor(shift?.name || '', shift?.shiftStart, shift?.shiftEnd);
            let shiftClass = 'shift-day';
            if (shiftColorClass === 'bg-shift-night') {
              shiftClass = 'shift-night';
            } else if (shiftColorClass === 'bg-shift-noon') {
              shiftClass = 'shift-noon';
            } else if (shiftColorClass === 'bg-shift-off') {
              shiftClass = 'shift-off';
            }
            
            const staffColor = getStaffColorHex(event.extendedProps.staffId);
            
            setSelectedEvent({
              title: event.title,
              staffName: staff?.name,
              staffId: event.extendedProps.staffId,
              staffColor: staffColor,
              shiftName: shift?.name,
              shiftClass: shiftClass,
              date: dayjs(event.start).format("DD.MM.YYYY"),
              startTime: dayjs(assignment?.shiftStart).format("HH:mm"),
              endTime: dayjs(assignment?.shiftEnd).format("HH:mm"),
            });
            setShowPopup(true);
          }}
          eventDrop={(info) => {
            const event = info.event;
            const newDate = dayjs(event.start);
            
            const oldAssignment = schedule?.assignments?.find(a => a.id === event.id);
            if(oldAssignment) {
              const oldStart = dayjs(oldAssignment.shiftStart);
              const oldEnd = dayjs(oldAssignment.shiftEnd);
              
              const newStart = newDate
                .hour(oldStart.hour())
                .minute(oldStart.minute())
                .second(oldStart.second());
              const newEnd = newDate
                .hour(oldEnd.hour())
                .minute(oldEnd.minute())
                .second(oldEnd.second());
              
              dispatch(updateEvent({
                eventId: event.id,
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString()
              }) as any);
            }
          }}
        />
      </div>
    </div>
  );
};

export default CalendarContainer;
