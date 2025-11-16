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

  const getColorForStaff = (staffId: string, shiftId: string) => {
    const staffIndex = schedule?.staffs?.findIndex(s => s.id === staffId);
    const shiftIndex = schedule?.shifts?.findIndex(s => s.id === shiftId);
    
    const colorClasses = [
      "bg-one", "bg-two", "bg-three", "bg-four", "bg-five", 
      "bg-six", "bg-seven", "bg-eight", "bg-nine", "bg-ten",
      "bg-eleven", "bg-twelve", "bg-thirteen", "bg-fourteen", "bg-fifteen",
      "bg-sixteen", "bg-seventeen", "bg-eighteen", "bg-nineteen", "bg-twenty"
    ];
    
    const index = (staffIndex + shiftIndex) % colorClasses.length;
    return colorClasses[index];
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
      
      const colorClass = getColorForStaff(filteredAssignments[i]?.staffId, filteredAssignments[i]?.shiftId);

      const work = {
        id: filteredAssignments[i]?.id,
        title: getShiftById(filteredAssignments[i]?.shiftId)?.name || "Shift",
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

    // pair highlights hesaplama
    const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
    const pairColors: {[key: string]: string} = {};
    
    if(selectedStaff?.pairList && selectedStaff.pairList.length > 0) {
      selectedStaff.pairList.forEach((pair: any) => {
        if(pair.startDate && pair.endDate) {
          const pairStaff = schedule?.staffs?.find(s => s.id === pair.pairStaffId);
          if(pairStaff) {
            const pairColor = getColorForStaff(pair.pairStaffId, "");
            const pairDates = getDatesBetween(pair.startDate, pair.endDate);
            
            pairDates.forEach(date => {
              pairColors[date] = pairColor;
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
      const firstStaffId = schedule.staffs[0].id;
      setSelectedStaffId(firstStaffId);
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
            <h3>Loading schedule data...</h3>
            <p>Please wait while we load the calendar information.</p>
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
            <div className="popup-header">
              <h3>Event Detayları</h3>
              <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
            </div>
            <div className="popup-content">
              <div className="popup-row">
                <strong>Personel:</strong> <span>{selectedEvent.staffName}</span>
              </div>
              <div className="popup-row">
                <strong>Vardiya:</strong> <span>{selectedEvent.shiftName}</span>
              </div>
              <div className="popup-row">
                <strong>Tarih:</strong> <span>{selectedEvent.date}</span>
              </div>
              <div className="popup-row">
                <strong>Başlangıç:</strong> <span>{selectedEvent.startTime}</span>
              </div>
              <div className="popup-row">
                <strong>Bitiş:</strong> <span>{selectedEvent.endTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any) => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`staff ${
                staff.id === selectedStaffId ? "active" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
              </svg>
              <span>{staff.name}</span>
            </div>
          ))}
        </div>
        <FullCalendar
          ref={calendarRef}
          locale={auth?.language || "en"}
          plugins={getPlugins()}
          contentHeight={400}
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
          fixedWeekCount={true}
          showNonCurrentDates={true}
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

            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());

            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
            const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
              info.end,
              "days"
            );
            if (startDiff < 0 && startDiff > -35 && prevButton) prevButton.disabled = true;
            else if(prevButton) prevButton.disabled = false;

            if (endDiff < 0 && endDiff > -32 && nextButton) nextButton.disabled = true;
            else if(nextButton) nextButton.disabled = false;
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
              const colorClass = isPairDay;
              const colorMap: {[key: string]: string} = {
                "bg-one": "#fcc729",
                "bg-two": "#ff8847",
                "bg-three": "#c0c033",
                "bg-four": "#32a852",
                "bg-five": "#32a8a2",
                "bg-six": "#327ba8",
                "bg-seven": "#3244a8",
                "bg-eight": "#5a32a8",
                "bg-nine": "#a832a4",
                "bg-ten": "#fffe88",
                "bg-eleven": "#c2068a",
                "bg-twelve": "#c28d06",
                "bg-thirteen": "#a2c206",
                "bg-fourteen": "#3bc206",
                "bg-fifteen": "#108f7c",
              };
              
              cellStyle = {
                borderBottom: `4px solid ${colorMap[colorClass] || "#c2068a"}`
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
            
            setSelectedEvent({
              title: event.title,
              staffName: staff?.name,
              shiftName: shift?.name,
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
